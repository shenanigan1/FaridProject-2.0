from rest_framework import serializers
from evaluations.models import Evaluation
from candidates.models import Candidate
from templates_grid.models import Template
from templates_grid.models import TemplateVersion
from users.models import User
from recruitment.models import JobApplication


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


class SubjectEvaluationSerializer(serializers.ModelSerializer):
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
            "created_at",
            "updated_at",
            "completed_at",
            "validated_at",
        ]
        read_only_fields = fields


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


class LaunchEvaluationSerializer(serializers.Serializer):
    application_id = serializers.IntegerField(required=True)
    template_id = serializers.IntegerField(required=True)
    assigned_to_id = serializers.IntegerField(required=False)

    def validate(self, attrs):
        try:
            application = JobApplication.objects.select_related(
                "candidate__user", "position"
            ).get(id=attrs["application_id"])
        except JobApplication.DoesNotExist:
            raise serializers.ValidationError(
                {"application_id": "Unknown job application."}
            )

        try:
            template = Template.objects.get(id=attrs["template_id"])
        except Template.DoesNotExist:
            raise serializers.ValidationError({"template_id": "Unknown template."})

        template_version = (
            TemplateVersion.objects.filter(template=template).order_by("-version").first()
        )
        if not template_version:
            raise serializers.ValidationError(
                {"template_id": "No template version exists for this template."}
            )

        assigned_to = None
        assigned_to_id = attrs.get("assigned_to_id")
        if assigned_to_id is not None:
            try:
                assigned_to = User.objects.get(id=assigned_to_id)
            except User.DoesNotExist:
                raise serializers.ValidationError(
                    {"assigned_to_id": "Unknown assigned user."}
                )

        duplicate = Evaluation.objects.filter(
            application=application, status="in_progress"
        ).exists()
        if duplicate:
            raise serializers.ValidationError(
                {"application_id": "This application already has an in-progress test."}
            )

        attrs["application"] = application
        attrs["template_version"] = template_version
        attrs["assigned_to"] = assigned_to
        return attrs

    def create(self, validated_data):
        application = validated_data["application"]
        return Evaluation.objects.create(
            subject=application.candidate.user,
            application=application,
            position=application.position,
            template_version=validated_data["template_version"],
            assigned_to=validated_data["assigned_to"],
            status="in_progress",
        )
