from django.db import IntegrityError
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from candidates.models import Candidate
from users.models import User


class CandidateUserSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(required=True, allow_blank=False)
    last_name = serializers.CharField(required=True, allow_blank=False)
    email = serializers.EmailField(required=True)
    phone = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ["first_name", "last_name", "email", "phone"]


class CandidateSerializer(serializers.ModelSerializer):
    user = CandidateUserSerializer()

    class Meta:
        model = Candidate
        fields = ["id", "user", "status", "target_position", "flag", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]

    def create(self, validated_data):
        user_data = validated_data.pop("user")

        try:
            user = User.objects.create_user(
                email=user_data["email"],
                password=None,
                first_name=user_data.get("first_name", ""),
                last_name=user_data.get("last_name", ""),
                phone=user_data.get("phone", ""),
            )
        except (IntegrityError, DjangoValidationError):
            raise serializers.ValidationError({"user": {"email": ["This email is already used."]}})

        return Candidate.objects.create(user=user, **validated_data)
    
    def update(self, instance, validated_data):
        user_data = validated_data.pop("user", None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if user_data:
            user = instance.user
            for attr, value in user_data.items():
                setattr(user, attr, value)
            user.save()

        return instance