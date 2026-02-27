from rest_framework import serializers
from templates_grid.models import QuestionPool


class QuestionPoolSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuestionPool
        fields = ["id", "name", "description", "code", "created_at"]
        read_only_fields = ["id", "created_at"]
