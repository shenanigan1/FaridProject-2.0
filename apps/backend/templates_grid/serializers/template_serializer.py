from rest_framework import serializers
from templates_grid.models import Template

class TemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Template
        fields = ["id", "name"]
        extra_kwargs = {
            "name": {"required": True},
        }
