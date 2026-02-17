from rest_framework import serializers
from templates_grid.models import Template

class TemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Template
        fields = ["id", "nom", "type", "poste_id"]
        extra_kwargs = {
            "nom": {"required": True},
            "type": {"required": True},
            "poste_id": {"required": True},
        }
