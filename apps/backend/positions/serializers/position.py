from rest_framework import serializers
from positions.models import Position


class PositionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Position
        fields = [
            "id",
            "company",
            "title",
            "description",
            "department",
            "contract_type",
            "location",
            "salary",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

class PublicPositionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Position
        fields = [
            "id",
            "title",
            "location",
            "contract_type",
            "description",
            "department",
            "salary",
            "created_at",
        ]