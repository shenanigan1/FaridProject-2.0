from rest_framework import serializers
from evaluations.models import Evaluation
from evaluations.services.assign_test import AssignTestToApplicationService


class EvaluationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Evaluation
        fields = [
            "id",
            "subject",
            "application",
            "position",
            "template_version",
            "assigned_to",
            "status",
            "subject_comment",
            "internal_comment",
            "created_at",
            "updated_at",
            "completed_at",
            "validated_at",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
            "completed_at",
            "validated_at",
        ]


class AssignEvaluationSerializer(serializers.Serializer):
    application_id = serializers.IntegerField(required=True)
    evaluator_id = serializers.IntegerField(required=True)
    template_id = serializers.IntegerField(required=False)

    def create(self, validated_data):
        return AssignTestToApplicationService.execute(
            application_id=validated_data["application_id"],
            evaluator_id=validated_data["evaluator_id"],
            template_id=validated_data.get("template_id"),
        )

    def to_representation(self, instance: Evaluation):
        return EvaluationSerializer(instance).data
