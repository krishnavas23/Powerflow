from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
from .serializers import (
    EnergyPredictRequestSerializer,
    EnergyPredictResponseSerializer,
    HouseholdConsumptionRequestSerializer,
    HouseholdConsumptionResponseSerializer,
    RecommendationRequestSerializer,
    RecommendationResponseSerializer,
)

# Import ML helpers
from models.ml_service import train_optimized_model, predict_energy
from pathlib import Path
import os
import threading
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestRegressor


_model_lock = threading.Lock()
_MODEL = None
_SCALER = None
_FEATURE_COLS = None
_HOUSE_MODEL = None
_HOUSE_SCALER = None
_HOUSE_FEATURES = None


def _ensure_model_loaded():
    global _MODEL, _SCALER, _FEATURE_COLS
    if _MODEL is not None:
        return
    with _model_lock:
        if _MODEL is None:
            try:
                base_dir = Path(__file__).resolve().parents[1]
                data_path = base_dir / 'models' / 'solar_data.csv'
                print(f"DEBUG: Loading model from {data_path}")
                _MODEL, _SCALER, _FEATURE_COLS = train_optimized_model(str(data_path))
                print(f"DEBUG: Model loaded successfully. Features: {_FEATURE_COLS}")
            except Exception as e:
                print(f"DEBUG: Error loading model: {e}")
                import traceback
                traceback.print_exc()
                raise


class PredictEnergyView(APIView):
    def post(self, request):
        serializer = EnergyPredictRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        _ensure_model_loaded()
        
        # Check if model loaded successfully
        if _MODEL is None or _SCALER is None or _FEATURE_COLS is None:
            return Response({'error': 'Model failed to load. Please check server logs.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        city = serializer.validated_data['city']
        capacity = serializer.validated_data['capacity_kw']
        efficiency = serializer.validated_data['efficiency']
        past_avg = serializer.validated_data['past_avg_kwh']

        api_key = getattr(settings, 'OPENWEATHER_API_KEY', None) or os.environ.get('OPENWEATHER_API_KEY')
        if not api_key:
            return Response(
                {'error': 'OPENWEATHER_API_KEY is not configured on the server'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        try:
            print(f"DEBUG: Calling predict_energy with city={city}, capacity={capacity}, efficiency={efficiency}, past_avg={past_avg}")
            print(f"DEBUG: Model is None: {_MODEL is None}")
            print(f"DEBUG: Scaler is None: {_SCALER is None}")
            print(f"DEBUG: Features is None: {_FEATURE_COLS is None}")
            result = predict_energy(
                city=city,
                capacity=capacity,
                efficiency=efficiency,
                past_avg=past_avg,
                model=_MODEL,
                scaler=_SCALER,
                feature_cols=_FEATURE_COLS,
                api_key=api_key
            )
            print(f"DEBUG: predict_energy returned: {result}")
        except Exception as exc:
            print(f"DEBUG: Exception occurred: {exc}")
            import traceback
            traceback.print_exc()
            # Handle specific NoneType error from weather API
            if "NoneType" in str(exc):
                return Response({'error': 'Weather data unavailable for this city. Please try a different city.'}, status=status.HTTP_400_BAD_REQUEST)
            return Response({'error': str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        if result is None:
            return Response({'error': 'City not found or weather API error'}, status=status.HTTP_400_BAD_REQUEST)

        response = EnergyPredictResponseSerializer(result)
        return Response(response.data, status=status.HTTP_200_OK)


def _ensure_household_model_loaded():
    global _HOUSE_MODEL, _HOUSE_SCALER, _HOUSE_FEATURES
    if _HOUSE_MODEL is not None:
        return
    with _model_lock:
        if _HOUSE_MODEL is None:
            base_dir = Path(__file__).resolve().parents[1]
            csv_path = base_dir / 'consumption' / 'energy_testing_dataset.csv'
            data = pd.read_csv(csv_path)
            feature_cols = [
                'num_appliances','num_heavy','num_light','avg_heavy_wattage',
                'avg_light_wattage','avg_usage_hours','temperature','humidity',
                'day_type','prev_day_consumption'
            ]
            target_col = 'daily_consumption'

            # Basic cleaning: fill missing with column means
            for col in feature_cols + [target_col]:
                if data[col].isna().any():
                    data[col] = data[col].fillna(data[col].mean())

            X = data[feature_cols]
            y = data[target_col]

            X_train, _, y_train, _ = train_test_split(X, y, test_size=0.2, random_state=42)
            scaler = StandardScaler()
            X_train_scaled = scaler.fit_transform(X_train)
            model = RandomForestRegressor(n_estimators=200, random_state=42, n_jobs=-1)
            model.fit(X_train_scaled, y_train)

            _HOUSE_MODEL = model
            _HOUSE_SCALER = scaler
            _HOUSE_FEATURES = feature_cols


class HouseholdConsumptionView(APIView):
    def post(self, request):
        serializer = HouseholdConsumptionRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        _ensure_household_model_loaded()

        payload = serializer.validated_data

        # Provide reasonable defaults for optional ambient features if absent in dataset
        # (we trained with dataset means; here we use provided payload only)
        X = np.array([[
            payload['num_appliances'],
            payload['num_heavy'],
            payload['num_light'],
            payload['avg_heavy_wattage'],
            payload['avg_light_wattage'],
            payload['avg_usage_hours'],
            # If temperature/humidity not provided by client, we can set None; but schema requires numbers
            # The client example lacks these; to stay compatible, infer neutral means 25C and 50% humidity
            payload.get('temperature', 25.0),
            payload.get('humidity', 50.0),
            payload['day_type'],
            payload['prev_day_consumption'],
        ]])

        try:
            X_scaled = _HOUSE_SCALER.transform(X)
            pred = float(_HOUSE_MODEL.predict(X_scaled)[0])
        except Exception as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        # Fallback if model predicts non-positive consumption
        if pred <= 0:
            baseline_kw = (
                payload['num_heavy'] * payload['avg_heavy_wattage'] +
                payload['num_light'] * payload['avg_light_wattage']
            ) / 1000.0
            estimated = baseline_kw * payload['avg_usage_hours']
            # Weekend/holiday adjustment if day_type==1 increase by 5%
            if payload['day_type'] == 1:
                estimated *= 1.05
            # Blend with previous day's consumption
            pred = 0.5 * estimated + 0.5 * payload['prev_day_consumption']

        resp = HouseholdConsumptionResponseSerializer({'daily_consumption': max(0.0, pred)})
        return Response(resp.data, status=status.HTTP_200_OK)


class RecommendationView(APIView):
    def post(self, request):
        serializer = RecommendationRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        production = serializer.validated_data['production_kwh']
        consumption = serializer.validated_data['consumption_kwh']

        daily_balances = []
        for i in range(3):
            prod = float(production[i])
            cons = float(consumption[i])
            daily_balances.append({
                'day': i + 1,
                'production': prod,
                'consumption': cons,
                'balance': prod - cons,
            })

        total_production = sum(d['production'] for d in daily_balances)
        total_consumption = sum(d['consumption'] for d in daily_balances)
        net_balance = total_production - total_consumption

        # Recommendation logic adapted from recommend.py (_make_recommendation)
        if net_balance > 0 and total_consumption > 0:
            surplus_percentage = (net_balance / total_consumption) * 100.0
            if surplus_percentage > 20:
                recommendation = {
                    'action': 'SELL',
                    'confidence': 'HIGH',
                    'reason': f'Significant surplus of {net_balance:.2f} kWh ({surplus_percentage:.1f}% above consumption)',
                    'suggested_amount': net_balance * 0.8,
                    'keep_amount': net_balance * 0.2,
                }
            elif surplus_percentage > 10:
                recommendation = {
                    'action': 'SELL',
                    'confidence': 'MEDIUM',
                    'reason': f'Moderate surplus of {net_balance:.2f} kWh ({surplus_percentage:.1f}% above consumption)',
                    'suggested_amount': net_balance * 0.6,
                    'keep_amount': net_balance * 0.4,
                }
            else:
                recommendation = {
                    'action': 'HOLD',
                    'confidence': 'LOW',
                    'reason': f'Small surplus of {net_balance:.2f} kWh ({surplus_percentage:.1f}% above consumption). Keep for buffer.',
                    'suggested_amount': 0.0,
                    'keep_amount': net_balance,
                }
        elif net_balance > 0 and total_consumption == 0:
            # Edge case: zero consumption -> suggest holding
            recommendation = {
                'action': 'HOLD',
                'confidence': 'LOW',
                'reason': f'Surplus of {net_balance:.2f} kWh with zero consumption history. Keep as buffer.',
                'suggested_amount': 0.0,
                'keep_amount': net_balance,
            }
        else:
            recommendation = {
                'action': "DON'T SELL",
                'confidence': 'HIGH',
                'reason': f'Energy deficit of {abs(net_balance):.2f} kWh. Production insufficient for consumption.',
                'suggested_amount': 0.0,
                'keep_amount': 0.0,
            }

        response = RecommendationResponseSerializer({
            'daily_balances': daily_balances,
            'total_production': total_production,
            'total_consumption': total_consumption,
            'net_balance': net_balance,
            'recommendation': recommendation,
        })

        return Response(response.data, status=status.HTTP_200_OK)

