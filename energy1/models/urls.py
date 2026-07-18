from django.urls import path
from .views import predict_api

urlpatterns = [
    path('api/predict/', predict_api, name='predict_api'),
    
]


