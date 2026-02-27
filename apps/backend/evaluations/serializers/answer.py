from rest_framework import serializers
from templates_grid.models import SkillQuestion

class SkillAnswerSerializer(serializers.Serializer):
    question_id = serializers.IntegerField()
    value = serializers.IntegerField()

    def validate_question_id(self, value):
        if not SkillQuestion.objects.filter(id=value).exists():
            raise serializers.ValidationError("Invalid question_id.")
        return value
