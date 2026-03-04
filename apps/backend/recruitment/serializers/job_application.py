from rest_framework import serializers
from rest_framework.validators import UniqueTogetherValidator

from recruitment.models.job_application import JobApplication


class JobApplicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobApplication
        fields = ["id", "candidate", "position", "status", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]
        validators = [
            UniqueTogetherValidator(
                queryset=JobApplication.objects.all(),
                fields=["candidate", "position"],
                message="This candidate already applied to this position.",
            )
        ]
