from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import IntegrityError
from django.db import transaction
from rest_framework import serializers

from candidates.models import Candidate
from users.models import User
from users.models import UserRoles


class CandidateUserSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(required=True, allow_blank=False, max_length=150)
    last_name = serializers.CharField(required=True, allow_blank=False, max_length=150)
    email = serializers.EmailField(required=True)
    phone = serializers.CharField(required=False, allow_blank=True, max_length=32)
    password = serializers.CharField(required=False, write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ["first_name", "last_name", "email", "phone", "password"]

    def validate_password(self, value: str) -> str:
        validate_password(value)
        return value


class CandidateSerializer(serializers.ModelSerializer):
    user = CandidateUserSerializer()

    class Meta:
        model = Candidate
        fields = [
            "id",
            "user",
            "status",
            "target_position",
            "flag",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    @staticmethod
    def _email_already_used_error() -> serializers.ValidationError:
        return serializers.ValidationError(
            {"user": {"email": ["This email is already used."]}}
        )

    @staticmethod
    def _password_validation_error(
        error: DjangoValidationError,
    ) -> serializers.ValidationError:
        return serializers.ValidationError({"user": {"password": list(error.messages)}})

    def create(self, validated_data):
        user_data = validated_data.pop("user")
        raw_password = user_data.pop("password", None)

        with transaction.atomic():
            try:
                user = User.objects.create_user(
                    email=user_data["email"],
                    password=raw_password,
                    first_name=user_data.get("first_name", ""),
                    last_name=user_data.get("last_name", ""),
                    phone=user_data.get("phone", ""),
                    role=UserRoles.CANDIDATE,
                )
            except IntegrityError:
                raise self._email_already_used_error()

            return Candidate.objects.create(user=user, **validated_data)

    def update(self, instance, validated_data):
        user_data = validated_data.pop("user", None)

        with transaction.atomic():
            for attr, value in validated_data.items():
                setattr(instance, attr, value)
            instance.save()

            if user_data:
                user = instance.user
                raw_password = user_data.pop("password", None)

                for attr, value in user_data.items():
                    setattr(user, attr, value)

                if raw_password:
                    try:
                        validate_password(raw_password, user=user)
                    except DjangoValidationError as error:
                        raise self._password_validation_error(error)
                    user.set_password(raw_password)

                try:
                    user.save()
                except IntegrityError:
                    raise self._email_already_used_error()

            return instance
