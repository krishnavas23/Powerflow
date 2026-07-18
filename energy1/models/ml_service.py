import pandas as pd
import numpy as np
import requests
from xgboost import XGBRegressor
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
import os
import warnings
warnings.filterwarnings('ignore')

# ---------------- Load and Train Model ----------------
def load_and_engineer_features(filepath):
    data = pd.read_csv(filepath)
    data['temp_humidity_interaction'] = data['temperature'] * data['humidity'] / 100
    data['effective_irradiance'] = data['solar_irradiance'] * (1 - data['cloud_cover'] / 100)
    data['capacity_efficiency'] = data['panel_capacity_kw'] * data['panel_efficiency']
    data['sun_intensity'] = data['solar_irradiance'] * data['sunlight_hours']
    data['performance_ratio'] = data['past_avg_kwh'] / (data['panel_capacity_kw'] * data['sunlight_hours'] + 0.001)
    data['temp_efficiency_loss'] = np.maximum(0, data['temperature'] - 25) * 0.004
    data['adjusted_efficiency'] = data['panel_efficiency'] * (1 - data['temp_efficiency_loss'])
    data['optimal_conditions'] = ((data['temperature'] < 35) & (data['cloud_cover'] < 30) & (data['sunlight_hours'] > 5)).astype(int)
    return data

def train_optimized_model(filepath):
    data = load_and_engineer_features(filepath)
    feature_cols = [
        "temperature", "humidity", "cloud_cover", "solar_irradiance",
        "sunlight_hours", "panel_capacity_kw", "panel_efficiency", "past_avg_kwh",
        "temp_humidity_interaction", "effective_irradiance", "capacity_efficiency",
        "sun_intensity", "performance_ratio", "adjusted_efficiency", "optimal_conditions"
    ]
    X = data[feature_cols]
    y = data["energy_production_kwh"]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)

    model = XGBRegressor(
        n_estimators=300, learning_rate=0.05, max_depth=6,
        subsample=0.8, colsample_bytree=0.8, random_state=42
    )
    model.fit(X_train_scaled, y_train)

    return model, scaler, feature_cols

# ---------------- Weather API ----------------
def get_weather_data(city, api_key):
    try:
        url = f"https://api.openweathermap.org/data/2.5/weather?q={city}&units=metric&appid={api_key}"
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        # Check if required fields exist and are not None
        if not all(key in data for key in ["main", "clouds", "sys"]):
            return {'city_found': False}
            
        temp = data["main"].get("temp")
        humidity = data["main"].get("humidity")
        clouds = data["clouds"].get("all")
        sunrise = data["sys"].get("sunrise")
        sunset = data["sys"].get("sunset")
        
        # Check for None values
        if any(val is None for val in [temp, humidity, clouds, sunrise, sunset]):
            return {'city_found': False}
            
        sun_hours = (sunset - sunrise) / 3600
        clear_sky_irradiance = 1000
        cloud_factor = (100 - clouds) / 100
        atmospheric_factor = 0.7 + 0.3 * cloud_factor
        solar_irradiance = clear_sky_irradiance * cloud_factor * atmospheric_factor
        
        return {
            'temp': temp,
            'humidity': humidity,
            'clouds': clouds,
            'sun_hours': sun_hours,
            'solar_irradiance': solar_irradiance,
            'city_found': True
        }
    except Exception:
        return {'city_found': False}

# ---------------- Prediction ----------------
def predict_energy(city, capacity, efficiency, past_avg, model, scaler, feature_cols, api_key):
    print(f"DEBUG: predict_energy called with city={city}")
    weather_data = get_weather_data(city, api_key)
    print(f"DEBUG: weather_data = {weather_data}")
    if not weather_data['city_found']:
        return None

    # Extract weather data with fallback values
    temp = weather_data.get('temp', 25.0)  # Default 25°C
    humidity = weather_data.get('humidity', 50.0)  # Default 50%
    clouds = weather_data.get('clouds', 30.0)  # Default 30%
    sun_hours = weather_data.get('sun_hours', 8.0)  # Default 8 hours
    solar_irradiance = weather_data.get('solar_irradiance', 500.0)  # Default 500 W/m²

    print(f"DEBUG: Extracted values - temp={temp}, humidity={humidity}, clouds={clouds}, sun_hours={sun_hours}, solar_irradiance={solar_irradiance}")

    # Check for None values and use defaults
    if temp is None:
        temp = 25.0
    if humidity is None:
        humidity = 50.0
    if clouds is None:
        clouds = 30.0
    if sun_hours is None:
        sun_hours = 8.0
    if solar_irradiance is None:
        solar_irradiance = 500.0

    temp_humidity_interaction = temp * humidity / 100
    effective_irradiance = solar_irradiance * (1 - clouds / 100)
    capacity_efficiency = capacity * efficiency
    sun_intensity = solar_irradiance * sun_hours
    performance_ratio = past_avg / (capacity * sun_hours + 0.001)
    temp_efficiency_loss = max(0, temp - 25) * 0.004
    adjusted_efficiency = efficiency * (1 - temp_efficiency_loss)
    optimal_conditions = int((temp < 35) and (clouds < 30) and (sun_hours > 5))

    X_today = np.array([[temp, humidity, clouds, solar_irradiance, sun_hours,
                         capacity, efficiency, past_avg,
                         temp_humidity_interaction, effective_irradiance,
                         capacity_efficiency, sun_intensity, performance_ratio,
                         adjusted_efficiency, optimal_conditions]])
    X_today_scaled = scaler.transform(X_today)
    pred_kwh = model.predict(X_today_scaled)[0]
    pred_kwh = max(0, pred_kwh)
    max_theoretical = capacity * sun_hours * efficiency
    pred_kwh = min(pred_kwh, max_theoretical * 1.1)

    return {
        "city": city,
        "temperature": temp,
        "humidity": humidity,
        "cloud_cover": clouds,
        "sunlight_hours": sun_hours,
        "solar_irradiance": solar_irradiance,
        "predicted_energy_kwh": float(pred_kwh)
    }
