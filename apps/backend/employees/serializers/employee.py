from django.db import IntegrityError
from rest_framework import serializers

from employees.models import Employee
from users.models import User


class EmployeeUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["first_name", "last_name", "email", "phone"]


class EmployeeSerializer(serializers.ModelSerializer):
    user = EmployeeUserSerializer()

    class Meta:
        model = Employee
        fields = ["id", "user", "employee_number", "department", "created_at", "updated_at"]
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
        except IntegrityError:
            raise serializers.ValidationError({"user": {"email": ["This email is already used."]}})

        try:
            return Employee.objects.create(user=user, **validated_data)
        except IntegrityError:
            # employee_number uniqueness
            raise serializers.ValidationError({"employee_number": ["This employee number is already used."]})

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