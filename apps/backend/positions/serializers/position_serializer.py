from rest_framework import serializers
from positions.models import Position

class PositionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Position
        fields = [
            "id",
            "title",
            "description",
            "department",
            "contract_type",
            "company_id",
            "location",
            "salary",
        ]
        extra_kwargs = {
            "title": {"required": True},
            "department": {"required": True},
            "contract_type": {"required": True},
            "company_id": {"required": True},
        }
