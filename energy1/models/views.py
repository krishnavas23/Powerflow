from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from django.conf import settings
import json
import os

from .ml_service import predict_energy, load_and_engineer_features, train_optimized_model

CSV_PATH = os.path.join(os.path.dirname(__file__), 'solar_data.csv')

# Load model at startup
try:
    model, scaler, feature_cols = train_optimized_model(CSV_PATH)
except Exception as e:
    print("Error loading model:", e)
    model, scaler, feature_cols = None, None, None

@csrf_exempt
def predict_api(request):
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed"}, status=405)

    try:
        data = json.loads(request.body)
        city = data.get("city")
        capacity = float(data.get("panel_capacity_kw"))
        efficiency = float(data.get("panel_efficiency"))
        past_avg = float(data.get("past_avg_kwh"))

        api_key = getattr(settings, 'OPENWEATHER_API_KEY', None) or os.environ.get('OPENWEATHER_API_KEY')
        if not api_key:
            return JsonResponse({"error": "OPENWEATHER_API_KEY is not configured"}, status=500)

        prediction = predict_energy(city, capacity, efficiency, past_avg,
                                    model, scaler, feature_cols, api_key)

        if not prediction:
            return JsonResponse({"error": "Invalid city or unable to fetch weather"}, status=400)

        return JsonResponse(prediction)

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)



