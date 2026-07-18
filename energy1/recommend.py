# -----------------------------------------------------
# SOLAR ENERGY SELLING RECOMMENDATION SYSTEM
# -----------------------------------------------------

import pandas as pd
import numpy as np
import requests
from datetime import datetime, timedelta
import joblib
import os
from xgboost import XGBRegressor
from sklearn.preprocessing import StandardScaler
import warnings
from dotenv import load_dotenv
warnings.filterwarnings('ignore')

load_dotenv()

class SolarSellingRecommendation:
    """
    A comprehensive system to recommend whether to sell solar energy units
    based on 3-day rolling window analysis of production vs consumption
    """
    
    def __init__(self):
        self.solar_model = None
        self.solar_scaler = None
        self.consumption_model = None
        self.consumption_scaler = None
        self.api_key = os.environ.get('OPENWEATHER_API_KEY')
        if not self.api_key:
            raise RuntimeError('OPENWEATHER_API_KEY is not set. Add it to energy1/.env')
        
    def load_models(self):
        """Load pre-trained solar and consumption models"""
        try:
            # Load solar model
            if os.path.exists("solar_model.pkl"):
                self.solar_model = joblib.load("solar_model.pkl")
                self.solar_scaler = joblib.load("solar_scaler.pkl")
                print("Solar model loaded successfully")
            else:
                print("Solar model not found. Will use simplified prediction.")
                
            # Load consumption model
            if os.path.exists("final_energy_model.pkl"):
                self.consumption_model = joblib.load("final_energy_model.pkl")
                self.consumption_scaler = joblib.load("feature_scaler.pkl")
                print("Consumption model loaded successfully")
            else:
                print("Consumption model not found. Will use simplified prediction.")
                
        except Exception as e:
            print(f"Error loading models: {e}")
            
    def get_weather_forecast(self, city, days=3):
        """Get weather forecast for next N days"""
        try:
            # For simplicity, we'll use current weather and project forward
            # In production, you'd use a proper weather API with forecast
            url = f"https://api.openweathermap.org/data/2.5/weather?q={city}&units=metric&appid={self.api_key}"
            response = requests.get(url, timeout=10)
            data = response.json()
            
            if data["cod"] != 200:
                return None
                
            # Extract current weather
            temp = data["main"]["temp"]
            humidity = data["main"]["humidity"]
            clouds = data["clouds"]["all"]
            sunrise = data["sys"]["sunrise"]
            sunset = data["sys"]["sunset"]
            sun_hours = (sunset - sunrise) / 3600
            
            # Create forecast for next 3 days (simplified)
            forecast = []
            for i in range(days):
                # Add some variation to simulate different days
                day_temp = temp + np.random.normal(0, 2)
                day_clouds = max(0, min(100, clouds + np.random.normal(0, 10)))
                day_sun_hours = sun_hours + np.random.normal(0, 0.5)
                day_sun_hours = max(0, min(16, day_sun_hours))  # Reasonable bounds
                
                # Calculate solar irradiance
                clear_sky_irradiance = 1000
                cloud_factor = (100 - day_clouds) / 100
                solar_irradiance = clear_sky_irradiance * cloud_factor * 0.8
                
                forecast.append({
                    'day': i + 1,
                    'temperature': day_temp,
                    'humidity': humidity + np.random.normal(0, 5),
                    'cloud_cover': day_clouds,
                    'sunlight_hours': day_sun_hours,
                    'solar_irradiance': solar_irradiance
                })
                
            return forecast
            
        except Exception as e:
            print(f"Error fetching weather data: {e}")
            return None
    
    def predict_solar_production(self, weather_data, capacity, efficiency, past_avg):
        """Predict solar energy production for 3 days"""
        predictions = []
        
        for day_data in weather_data:
            temp = day_data['temperature']
            humidity = day_data['humidity']
            clouds = day_data['cloud_cover']
            sun_hours = day_data['sunlight_hours']
            solar_irradiance = day_data['solar_irradiance']
            
            if self.solar_model and self.solar_scaler:
                # Use trained model
                try:
                    # Create feature array (matching model.py structure)
                    X = np.array([[
                        temp, humidity, clouds, solar_irradiance, sun_hours,
                        capacity, efficiency, past_avg,
                        temp * humidity / 100,  # temp_humidity_interaction
                        solar_irradiance * (1 - clouds / 100),  # effective_irradiance
                        capacity * efficiency,  # capacity_efficiency
                        solar_irradiance * sun_hours,  # sun_intensity
                        past_avg / (capacity * sun_hours + 0.001),  # performance_ratio
                        efficiency * (1 - max(0, temp - 25) * 0.004),  # adjusted_efficiency
                        int((temp < 35) and (clouds < 30) and (sun_hours > 5))  # optimal_conditions
                    ]])
                    
                    X_scaled = self.solar_scaler.transform(X)
                    pred = self.solar_model.predict(X_scaled)[0]
                    pred = max(0, pred)
                    
                except Exception as e:
                    print(f"Model prediction failed, using simplified method: {e}")
                    pred = self._simplified_solar_prediction(temp, clouds, sun_hours, capacity, efficiency)
            else:
                # Simplified prediction
                pred = self._simplified_solar_prediction(temp, clouds, sun_hours, capacity, efficiency)
            
            predictions.append({
                'day': day_data['day'],
                'predicted_production': pred,
                'weather': day_data
            })
            
        return predictions
    
    def _simplified_solar_prediction(self, temp, clouds, sun_hours, capacity, efficiency):
        """Simplified solar prediction when model is not available"""
        # Basic calculation with weather factors
        irradiance_factor = (1 - clouds / 100) * (1 - abs(temp - 25) * 0.005)
        base_production = capacity * sun_hours * efficiency * irradiance_factor
        return max(0, base_production)
    
    def predict_consumption(self, user_data, days=3):
        """Predict energy consumption for 3 days"""
        predictions = []
        
        for day in range(1, days + 1):
            if self.consumption_model and self.consumption_scaler:
                try:
                    # Create feature array (matching model1.py structure)
                    sample_data = {
                        'num_appliances': user_data['num_appliances'],
                        'num_heavy': user_data['num_heavy'],
                        'num_light': user_data['num_light'],
                        'avg_heavy_wattage': user_data['avg_heavy_wattage'],
                        'avg_light_wattage': user_data['avg_light_wattage'],
                        'avg_usage_hours': user_data['avg_usage_hours'],
                        'day_type': user_data['day_type'],
                        'prev_day_consumption': user_data['prev_day_consumption']
                    }
                    
                    # Create DataFrame and engineer features
                    df = pd.DataFrame([sample_data])
                    df = self._engineer_consumption_features(df)
                    
                    # Scale and predict
                    df_scaled = self.consumption_scaler.transform(df)
                    pred = self.consumption_model.predict(df_scaled)[0]
                    pred = max(0, pred)
                    
                except Exception as e:
                    print(f"Consumption model failed, using simplified method: {e}")
                    pred = self._simplified_consumption_prediction(user_data)
            else:
                pred = self._simplified_consumption_prediction(user_data)
            
            predictions.append({
                'day': day,
                'predicted_consumption': pred
            })
            
        return predictions
    
    def _engineer_consumption_features(self, df):
        """Engineer features for consumption model"""
        df['total_wattage'] = df['num_heavy'] * df['avg_heavy_wattage'] + df['num_light'] * df['avg_light_wattage']
        df['heavy_to_light_ratio'] = df['num_heavy'] / (df['num_light'] + 1)
        df['appliance_density'] = df['num_appliances'] / (df['avg_usage_hours'] + 0.1)
        df['peak_load_estimate'] = df['num_heavy'] * df['avg_heavy_wattage'] * 0.7
        df['base_load_estimate'] = df['num_light'] * df['avg_light_wattage'] * 0.9
        df['consumption_trend'] = df['prev_day_consumption'] / (df['total_wattage'] / 1000 + 0.01)
        df['weekend_heavy_interaction'] = df['day_type'] * df['num_heavy']
        df['usage_efficiency'] = df['prev_day_consumption'] / (df['total_wattage'] * df['avg_usage_hours'] / 1000 + 0.01)
        df['average_appliance_power'] = df['total_wattage'] / (df['num_appliances'] + 1)
        df['heavy_usage_intensity'] = df['num_heavy'] * df['avg_usage_hours']
        df['light_usage_intensity'] = df['num_light'] * df['avg_usage_hours']
        return df
    
    def _simplified_consumption_prediction(self, user_data):
        """Simplified consumption prediction when model is not available"""
        # Basic calculation based on appliances
        total_wattage = (user_data['num_heavy'] * user_data['avg_heavy_wattage'] + 
                        user_data['num_light'] * user_data['avg_light_wattage'])
        daily_consumption = (total_wattage * user_data['avg_usage_hours']) / 1000
        return max(0, daily_consumption)
    
    def calculate_rolling_balance(self, production_data, consumption_data):
        """Calculate rolling 3-day balance and make recommendations"""
        print("\n" + "=" * 80)
        print("3-DAY ROLLING BALANCE ANALYSIS")
        print("=" * 80)
        
        # Calculate daily balances
        daily_balances = []
        for i in range(3):
            production = production_data[i]['predicted_production']
            consumption = consumption_data[i]['predicted_consumption']
            balance = production - consumption
            
            daily_balances.append({
                'day': i + 1,
                'production': production,
                'consumption': consumption,
                'balance': balance
            })
            
            print(f"\nDay {i+1}:")
            print(f"   Production: {production:.2f} kWh")
            print(f"   Consumption: {consumption:.2f} kWh")
            print(f"   Net Balance: {balance:.2f} kWh")
            
        # Calculate 3-day rolling balance
        total_production = sum([d['production'] for d in daily_balances])
        total_consumption = sum([d['consumption'] for d in daily_balances])
        net_balance = total_production - total_consumption
        
        print(f"\n3-Day Summary:")
        print(f"   Total Production: {total_production:.2f} kWh")
        print(f"   Total Consumption: {total_consumption:.2f} kWh")
        print(f"   Net Balance: {net_balance:.2f} kWh")
        
        # Make recommendation
        recommendation = self._make_recommendation(net_balance, daily_balances)
        
        return {
            'daily_balances': daily_balances,
            'total_production': total_production,
            'total_consumption': total_consumption,
            'net_balance': net_balance,
            'recommendation': recommendation
        }
    
    def _make_recommendation(self, net_balance, daily_balances):
        """Make selling recommendation based on balance analysis"""
        print("\n" + "=" * 80)
        print("SELLING RECOMMENDATION")
        print("=" * 80)
        
        if net_balance > 0:
            # Positive balance - consider selling
            surplus_percentage = (net_balance / sum([d['consumption'] for d in daily_balances])) * 100
            
            if surplus_percentage > 20:  # More than 20% surplus
                recommendation = {
                    'action': 'SELL',
                    'confidence': 'HIGH',
                    'reason': f'Significant surplus of {net_balance:.2f} kWh ({surplus_percentage:.1f}% above consumption)',
                    'suggested_amount': net_balance * 0.8,  # Sell 80% of surplus
                    'keep_amount': net_balance * 0.2  # Keep 20% as buffer
                }
            elif surplus_percentage > 10:  # Moderate surplus
                recommendation = {
                    'action': 'SELL',
                    'confidence': 'MEDIUM',
                    'reason': f'Moderate surplus of {net_balance:.2f} kWh ({surplus_percentage:.1f}% above consumption)',
                    'suggested_amount': net_balance * 0.6,  # Sell 60% of surplus
                    'keep_amount': net_balance * 0.4  # Keep 40% as buffer
                }
            else:  # Small surplus
                recommendation = {
                    'action': 'HOLD',
                    'confidence': 'LOW',
                    'reason': f'Small surplus of {net_balance:.2f} kWh ({surplus_percentage:.1f}% above consumption). Keep for buffer.',
                    'suggested_amount': 0,
                    'keep_amount': net_balance
                }
        else:
            # Negative balance - don't sell
            deficit = abs(net_balance)
            recommendation = {
                'action': 'DON\'T SELL',
                'confidence': 'HIGH',
                'reason': f'Energy deficit of {deficit:.2f} kWh. Production insufficient for consumption.',
                'suggested_amount': 0,
                'keep_amount': 0
            }
        
        # Display recommendation
        print(f"\nRECOMMENDATION: {recommendation['action']}")
        print(f"Confidence: {recommendation['confidence']}")
        print(f"Reason: {recommendation['reason']}")
        
        if recommendation['suggested_amount'] > 0:
            print(f"Suggested selling amount: {recommendation['suggested_amount']:.2f} kWh")
            print(f"Keep as buffer: {recommendation['keep_amount']:.2f} kWh")
            
            # Calculate potential earnings
            rate_per_kwh = 0.12  # $0.12 per kWh (adjust as needed)
            potential_earnings = recommendation['suggested_amount'] * rate_per_kwh
            print(f"Potential earnings: ${potential_earnings:.2f}")
        
        return recommendation
    
    def run_recommendation_system(self):
        """Main function to run the complete recommendation system"""
        print("\n" + "=" * 80)
        print("SOLAR ENERGY SELLING RECOMMENDATION SYSTEM")
        print("=" * 80)
        
        # Load models
        self.load_models()
        
        # Get user inputs
        print("\nENTER YOUR SOLAR PANEL DETAILS")
        print("-" * 50)
        
        try:
            city = input("Enter your city name: ").strip()
            capacity = float(input("Enter solar panel capacity (kW): "))
            efficiency = float(input("Enter panel efficiency (%): ")) / 100
            past_avg = float(input("Enter past average daily production (kWh): "))
            
            if capacity <= 0 or efficiency <= 0 or efficiency > 1 or past_avg < 0:
                print("Invalid input values!")
                return
                
        except ValueError:
            print("Please enter valid numeric values!")
            return
        
        # Get weather forecast
        print(f"\nFetching weather forecast for {city}...")
        weather_forecast = self.get_weather_forecast(city, 3)
        
        if not weather_forecast:
            print("Unable to fetch weather data. Please check city name and try again.")
            return
        
        # Predict solar production
        print("\nPredicting solar production for next 3 days...")
        production_data = self.predict_solar_production(weather_forecast, capacity, efficiency, past_avg)
        
        # Get consumption data
        print("\nENTER YOUR HOUSEHOLD CONSUMPTION DATA")
        print("-" * 50)
        
        try:
            num_appliances = int(input("Total number of appliances: "))
            num_heavy = int(input("Number of heavy appliances (>1000W): "))
            num_light = num_appliances - num_heavy
            avg_heavy_wattage = float(input("Average heavy appliance wattage: "))
            avg_light_wattage = float(input("Average light appliance wattage: "))
            avg_usage_hours = float(input("Average daily usage hours: "))
            day_type = int(input("Day type (0=weekday, 1=weekend): "))
            prev_day_consumption = float(input("Previous day's consumption (kWh): "))
            
        except ValueError:
            print("Please enter valid numeric values!")
            return
        
        user_data = {
            'num_appliances': num_appliances,
            'num_heavy': num_heavy,
            'num_light': num_light,
            'avg_heavy_wattage': avg_heavy_wattage,
            'avg_light_wattage': avg_light_wattage,
            'avg_usage_hours': avg_usage_hours,
            'day_type': day_type,
            'prev_day_consumption': prev_day_consumption
        }
        
        # Predict consumption
        print("\nPredicting energy consumption for next 3 days...")
        consumption_data = self.predict_consumption(user_data, 3)
        
        # Calculate balance and make recommendation
        result = self.calculate_rolling_balance(production_data, consumption_data)
        
        print("\n" + "=" * 80)
        print("ANALYSIS COMPLETE")
        print("=" * 80)
        
        return result

# -----------------------------------------------------
# MAIN EXECUTION
# -----------------------------------------------------

if __name__ == "__main__":
    # Create and run recommendation system
    recommender = SolarSellingRecommendation()
    result = recommender.run_recommendation_system()