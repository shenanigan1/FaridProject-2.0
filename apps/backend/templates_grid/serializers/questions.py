
from rest_framework import serializers
from templates_grid.models import SkillQuestion


class SkillQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = SkillQuestion
        fields = [
            "id",
            "pool",
            "label",
            "type",
            "is_mandatory",
            "min_score",
            "max_score",
            "order",
        ]
        read_only_fields = ["id"]
