from rest_framework import serializers


class EnergyPredictRequestSerializer(serializers.Serializer):
    city = serializers.CharField(max_length=100)
    capacity_kw = serializers.FloatField(min_value=0.0)
    efficiency = serializers.FloatField(min_value=0.0, max_value=1.0)
    past_avg_kwh = serializers.FloatField(min_value=0.0)


class EnergyPredictResponseSerializer(serializers.Serializer):
    city = serializers.CharField()
    temperature = serializers.FloatField()
    humidity = serializers.FloatField()
    cloud_cover = serializers.FloatField()
    sunlight_hours = serializers.FloatField()
    solar_irradiance = serializers.FloatField()
    predicted_energy_kwh = serializers.FloatField()


class HouseholdConsumptionRequestSerializer(serializers.Serializer):
    num_appliances = serializers.IntegerField(min_value=0)
    num_heavy = serializers.IntegerField(min_value=0)
    num_light = serializers.IntegerField(min_value=0)
    avg_heavy_wattage = serializers.FloatField(min_value=0.0)
    avg_light_wattage = serializers.FloatField(min_value=0.0)
    avg_usage_hours = serializers.FloatField(min_value=0.0)
    day_type = serializers.IntegerField(min_value=0, max_value=1)
    prev_day_consumption = serializers.FloatField(min_value=0.0)
    temperature = serializers.FloatField(required=False)
    humidity = serializers.FloatField(required=False)


class HouseholdConsumptionResponseSerializer(serializers.Serializer):
    daily_consumption = serializers.FloatField()


class RecommendationDaySerializer(serializers.Serializer):
    day = serializers.IntegerField(min_value=1)
    production = serializers.FloatField()
    consumption = serializers.FloatField()
    balance = serializers.FloatField()


class RecommendationRequestSerializer(serializers.Serializer):
    # Provide either arrays or daily items; we accept arrays for simplicity
    production_kwh = serializers.ListField(
        child=serializers.FloatField(), min_length=3, max_length=3
    )
    consumption_kwh = serializers.ListField(
        child=serializers.FloatField(), min_length=3, max_length=3
    )


class RecommendationResponseSerializer(serializers.Serializer):
    daily_balances = RecommendationDaySerializer(many=True)
    total_production = serializers.FloatField()
    total_consumption = serializers.FloatField()
    net_balance = serializers.FloatField()
    recommendation = serializers.DictField()

