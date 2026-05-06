from rest_framework import serializers
from rest_framework.validators import UniqueTogetherValidator

from recruitment.models.job_application import JobApplication


class JobApplicationSerializer(serializers.ModelSerializer):
    candidate_full_name = serializers.SerializerMethodField()
    candidate_email = serializers.EmailField(
        source="candidate.user.email", read_only=True
    )
    candidate_phone = serializers.CharField(
        source="candidate.user.phone", read_only=True
    )

    class Meta:
        model = JobApplication
        fields = [
            "id",
            "candidate",
            "candidate_full_name",
            "candidate_email",
            "candidate_phone",
            "position",
            "status",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
        validators = [
            UniqueTogetherValidator(
                queryset=JobApplication.objects.all(),
                fields=["candidate", "position"],
                message="This candidate already applied to this position.",
            )
        ]

    def get_candidate_full_name(self, obj):
        user = obj.candidate.user
        full_name = f"{user.first_name} {user.last_name}".strip()
        return full_name or user.email
