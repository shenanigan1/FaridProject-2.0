from rest_framework import serializers
from evaluations.models import Evaluation
from candidates.models import Candidate
from templates_grid.models import Template
from users.models import User


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


class StartEvaluationSerializer(serializers.Serializer):
    candidate_id = serializers.IntegerField(required=True)
    grid_id = serializers.IntegerField(required=True)
    evaluator_id = serializers.IntegerField(required=True)

    def validate(self, data):
        # Vérifier existence des objets
        try:
            data["candidate"] = Candidate.objects.get(id=data["candidate_id"])
        except Candidate.DoesNotExist:
            raise serializers.ValidationError({"candidate_id": "Invalid candidate_id"})

        try:
            data["template"] = Template.objects.get(id=data["grid_id"])
        except Template.DoesNotExist:
            raise serializers.ValidationError({"grid_id": "Invalid grid_id"})

        try:
            data["evaluator"] = User.objects.get(id=data["evaluator_id"])
        except User.DoesNotExist:
            raise serializers.ValidationError({"evaluator_id": "Invalid evaluator_id"})

        return data

    def create(self, validated_data):
        return Evaluation.objects.create(
            candidate=validated_data["candidate"],
            template=validated_data["template"],
            assigned_to=validated_data["evaluator"],
            status="in_progress",
        )
