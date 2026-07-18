from django.urls import path
from .views import PredictEnergyView, HouseholdConsumptionView, RecommendationView
from .simple_views import SimplePredictEnergyView


urlpatterns = [
    path('predict/', PredictEnergyView.as_view(), name='predict-energy'),
    path('predict-simple/', SimplePredictEnergyView.as_view(), name='predict-energy-simple'),
    path('consumption/', HouseholdConsumptionView.as_view(), name='household-consumption'),
    path('recommend/', RecommendationView.as_view(), name='energy-recommendation'),
]


