from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
from .serializers import EnergyPredictRequestSerializer, EnergyPredictResponseSerializer
import requests
import numpy as np
from pathlib import Path
import os
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
import threading

_model_lock = threading.Lock()
_SIMPLE_MODEL = None
_SIMPLE_SCALER = None

def _load_simple_model():
    global _SIMPLE_MODEL, _SIMPLE_SCALER
    if _SIMPLE_MODEL is not None:
        return
    
    with _model_lock:
        if _SIMPLE_MODEL is None:
            try:
                base_dir = Path(__file__).resolve().parents[1]
                data_path = base_dir / 'models' / 'solar_data.csv'
                data = pd.read_csv(data_path)
                
                # Simple feature engineering
                data['temp_humidity_interaction'] = data['temperature'] * data['humidity'] / 100
                data['effective_irradiance'] = data['solar_irradiance'] * (1 - data['cloud_cover'] / 100)
                data['capacity_efficiency'] = data['panel_capacity_kw'] * data['panel_efficiency']
                data['sun_intensity'] = data['solar_irradiance'] * data['sunlight_hours']
                data['performance_ratio'] = data['past_avg_kwh'] / (data['panel_capacity_kw'] * data['sunlight_hours'] + 0.001)
                data['temp_efficiency_loss'] = np.maximum(0, data['temperature'] - 25) * 0.004
                data['adjusted_efficiency'] = data['panel_efficiency'] * (1 - data['temp_efficiency_loss'])
                data['optimal_conditions'] = ((data['temperature'] < 35) & (data['cloud_cover'] < 30) & (data['sunlight_hours'] > 5)).astype(int)
                
                feature_cols = [
                    "temperature", "humidity", "cloud_cover", "solar_irradiance",
                    "sunlight_hours", "panel_capacity_kw", "panel_efficiency", "past_avg_kwh",
                    "temp_humidity_interaction", "effective_irradiance", "capacity_efficiency",
                    "sun_intensity", "performance_ratio", "adjusted_efficiency", "optimal_conditions"
                ]
                
                X = data[feature_cols]
                y = data["energy_production_kwh"]
                
                X_train, _, y_train, _ = train_test_split(X, y, test_size=0.2, random_state=42)
                scaler = StandardScaler()
                X_train_scaled = scaler.fit_transform(X_train)
                
                model = RandomForestRegressor(n_estimators=100, random_state=42)
                model.fit(X_train_scaled, y_train)
                
                _SIMPLE_MODEL = model
                _SIMPLE_SCALER = scaler
                
            except Exception as e:
                print(f"Error loading simple model: {e}")
                raise

def _get_weather_simple(city, api_key):
    try:
        url = f"https://api.openweathermap.org/data/2.5/weather?q={city}&units=metric&appid={api_key}"
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        temp = data["main"]["temp"]
        humidity = data["main"]["humidity"]
        clouds = data["clouds"]["all"]
        sunrise = data["sys"]["sunrise"]
        sunset = data["sys"]["sunset"]
        sun_hours = (sunset - sunrise) / 3600
        
        clear_sky_irradiance = 1000
        cloud_factor = (100 - clouds) / 100
        atmospheric_factor = 0.7 + 0.3 * cloud_factor
        solar_irradiance = clear_sky_irradiance * cloud_factor * atmospheric_factor
        
        return {
            'temp': float(temp),
            'humidity': float(humidity),
            'clouds': float(clouds),
            'sun_hours': float(sun_hours),
            'solar_irradiance': float(solar_irradiance),
            'city_found': True
        }
    except Exception:
        return {'city_found': False}

class SimplePredictEnergyView(APIView):
    def post(self, request):
        serializer = EnergyPredictRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        _load_simple_model()
        
        if _SIMPLE_MODEL is None or _SIMPLE_SCALER is None:
            return Response({'error': 'Model failed to load'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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

        weather_data = _get_weather_simple(city, api_key)
        if not weather_data['city_found']:
            return Response({'error': 'City not found'}, status=status.HTTP_400_BAD_REQUEST)

        # Create features
        temp = weather_data['temp']
        humidity = weather_data['humidity']
        clouds = weather_data['clouds']
        sun_hours = weather_data['sun_hours']
        solar_irradiance = weather_data['solar_irradiance']

        temp_humidity_interaction = temp * humidity / 100
        effective_irradiance = solar_irradiance * (1 - clouds / 100)
        capacity_efficiency = capacity * efficiency
        sun_intensity = solar_irradiance * sun_hours
        performance_ratio = past_avg / (capacity * sun_hours + 0.001)
        temp_efficiency_loss = max(0, temp - 25) * 0.004
        adjusted_efficiency = efficiency * (1 - temp_efficiency_loss)
        optimal_conditions = int((temp < 35) and (clouds < 30) and (sun_hours > 5))

        X_today = np.array([[
            temp, humidity, clouds, solar_irradiance, sun_hours,
            capacity, efficiency, past_avg,
            temp_humidity_interaction, effective_irradiance, capacity_efficiency,
            sun_intensity, performance_ratio, adjusted_efficiency, optimal_conditions
        ]])
        
        X_today_scaled = _SIMPLE_SCALER.transform(X_today)
        pred_kwh = _SIMPLE_MODEL.predict(X_today_scaled)[0]
        pred_kwh = max(0, pred_kwh)
        max_theoretical = capacity * sun_hours * efficiency
        pred_kwh = min(pred_kwh, max_theoretical * 1.1)

        result = {
            "city": city,
            "temperature": temp,
            "humidity": humidity,
            "cloud_cover": clouds,
            "sunlight_hours": sun_hours,
            "solar_irradiance": solar_irradiance,
            "predicted_energy_kwh": float(pred_kwh)
        }

        response = EnergyPredictResponseSerializer(result)
        return Response(response.data, status=status.HTTP_200_OK)


