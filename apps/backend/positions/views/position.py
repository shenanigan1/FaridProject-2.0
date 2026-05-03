from django.db import transaction
from django.db.utils import OperationalError, ProgrammingError
from positions.models import Position
from positions.models import PositionTestTemplateAssignment
from positions.serializers import (
    PositionSerializer,
    PositionTemplateAssignmentBulkSerializer,
    PositionTemplateAssignmentSerializer,
    PublicPositionSerializer,
)
from templates_grid.models import Template
from rest_framework.permissions import AllowAny
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework import status
from rest_framework.viewsets import ModelViewSet, ReadOnlyModelViewSet
from users.permissions import IsHrAdminOrDirector
from users.models import User


class PositionViewSet(ModelViewSet):
    queryset = Position.objects.select_related("company").all().order_by("id")
    serializer_class = PositionSerializer

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [IsAuthenticated()]

        if self.action in [
            "create",
            "update",
            "partial_update",
            "destroy",
            "test_templates",
            "set_test_templates",
        ]:
            return [IsAuthenticated(), IsHrAdminOrDirector()]

        return [IsAuthenticated()]

    @staticmethod
    def _safe_assignments_queryset(position):
        try:
            return (
                PositionTestTemplateAssignment.objects.select_related(
                    "template", "manager"
                )
                .filter(position=position)
                .order_by("order", "id")
            )
        except (ProgrammingError, OperationalError):
            return None

    @action(detail=True, methods=["get"], url_path="test-templates")
    def test_templates(self, request, pk=None):
        position = self.get_object()
        queryset = type(self)._safe_assignments_queryset(position)
        if queryset is None:
            return Response(
                {
                    "detail": (
                        "Position test-template assignments are unavailable. "
                        "Run migrations for the positions app."
                    )
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        serializer = PositionTemplateAssignmentSerializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @test_templates.mapping.put
    @transaction.atomic
    def set_test_templates(self, request, pk=None):
        position = self.get_object()
        serializer = PositionTemplateAssignmentBulkSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            PositionTestTemplateAssignment.objects.filter(position=position).delete()
        except (ProgrammingError, OperationalError):
            return Response(
                {
                    "detail": (
                        "Position test-template assignments are unavailable. "
                        "Run migrations for the positions app."
                    )
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        assignments = serializer.validated_data["assignments"]
        for index, item in enumerate(assignments):
            manager = None
            manager_id = item.get("manager_id")
            if manager_id is not None:
                manager = User.objects.get(id=manager_id)

            PositionTestTemplateAssignment.objects.create(
                position=position,
                template=Template.objects.get(id=item["template_id"]),
                manager=manager,
                order=item.get("order", index),
            )

        queryset = type(self)._safe_assignments_queryset(position)
        if queryset is None:
            return Response(
                {
                    "detail": (
                        "Position test-template assignments are unavailable. "
                        "Run migrations for the positions app."
                    )
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        output = PositionTemplateAssignmentSerializer(queryset, many=True)
        return Response(output.data, status=status.HTTP_200_OK)


class PublicPositionViewSet(ReadOnlyModelViewSet):
    permission_classes = [AllowAny]

    def get_queryset(self):
        return (
            Position.objects.filter(is_active=True)
            .select_related("company")
            .order_by("-created_at")
        )

    def get_serializer_class(self):
        return PublicPositionSerializer
