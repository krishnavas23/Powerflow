#!/usr/bin/env python
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from models.ml_service import train_optimized_model
import traceback

try:
    print("Testing model loading...")
    model, scaler, features = train_optimized_model("models/solar_data.csv")
    print(f"Model loaded successfully!")
    print(f"Features: {features}")
    print(f"Model type: {type(model)}")
    print(f"Scaler type: {type(scaler)}")
except Exception as e:
    print(f"Error loading model: {e}")
    traceback.print_exc()

