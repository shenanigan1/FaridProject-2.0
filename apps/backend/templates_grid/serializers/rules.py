from rest_framework import serializers
from templates_grid.models import TemplatePoolRule


class TemplatePoolRuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = TemplatePoolRule
        fields = ["id", "template", "section", "pool", "random_count", "order"]
        read_only_fields = ["id"]
        