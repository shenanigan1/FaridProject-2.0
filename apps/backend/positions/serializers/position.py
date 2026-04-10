from rest_framework import serializers
from positions.models import Position, PositionTestTemplateAssignment
from templates_grid.models import Template
from users.models import User, UserRoles


class PositionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Position
        fields = [
            "id",
            "company",
            "title",
            "description",
            "department",
            "contract_type",
            "location",
            "salary",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class PublicPositionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Position
        fields = [
            "id",
            "title",
            "location",
            "contract_type",
            "description",
            "department",
            "salary",
            "created_at",
        ]


class PositionTemplateAssignmentSerializer(serializers.ModelSerializer):
    template_name = serializers.CharField(source="template.name", read_only=True)
    manager_id = serializers.IntegerField(source="manager.id", read_only=True)
    manager_name = serializers.SerializerMethodField()

    class Meta:
        model = PositionTestTemplateAssignment
        fields = [
            "id",
            "position",
            "template",
            "template_name",
            "manager_id",
            "manager_name",
            "order",
        ]
        read_only_fields = ["id", "template_name", "manager_id", "manager_name"]

    def get_manager_name(self, obj):
        if not obj.manager:
            return None
        return obj.manager.full_name or obj.manager.email


class PositionTemplateAssignmentInputSerializer(serializers.Serializer):
    template_id = serializers.IntegerField()
    manager_id = serializers.IntegerField(required=False, allow_null=True)
    order = serializers.IntegerField(required=False, min_value=0)

    def validate_template_id(self, value):
        if not Template.objects.filter(id=value).exists():
            raise serializers.ValidationError("Unknown template.")
        return value

    def validate_manager_id(self, value):
        if value is None:
            return value
        try:
            manager = User.objects.get(id=value)
        except User.DoesNotExist:
            raise serializers.ValidationError("Unknown manager.")
        if manager.role != UserRoles.MANAGER:
            raise serializers.ValidationError("Assigned user must have manager role.")
        return value


class PositionTemplateAssignmentBulkSerializer(serializers.Serializer):
    assignments = PositionTemplateAssignmentInputSerializer(many=True)
