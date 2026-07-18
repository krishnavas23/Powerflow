#!/usr/bin/env python
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv()

from models.ml_service import train_optimized_model, predict_energy
import traceback

try:
    api_key = os.environ.get('OPENWEATHER_API_KEY')
    if not api_key:
        raise RuntimeError('OPENWEATHER_API_KEY is not set. Add it to energy1/.env')

    print("Loading model...")
    model, scaler, features = train_optimized_model("models/solar_data.csv")
    print("Model loaded successfully!")
    
    print("Testing prediction...")
    result = predict_energy(
        city="London",
        capacity=5.0,
        efficiency=0.18,
        past_avg=20.0,
        model=model,
        scaler=scaler,
        feature_cols=features,
        api_key=api_key,
    )
    print(f"Prediction result: {result}")
    
except Exception as e:
    print(f"Error: {e}")
    traceback.print_exc()
