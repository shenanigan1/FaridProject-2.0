from rest_framework import status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from evaluations.models.evaluation import Evaluation
from evaluations.serializers import (
    EvaluationSerializer,
    LaunchEvaluationSerializer,
    SubjectEvaluationSerializer,
)
from users.models import UserRoles
from users.permissions import IsHrAdminOrDirector


class EvaluationViewSet(ModelViewSet):
    queryset = (
        Evaluation.objects.select_related(
            "subject", "application", "position", "template_version", "assigned_to"
        )
        .all()
        .order_by("id")
    )
    serializer_class = EvaluationSerializer

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy", "launch"]:
            return [IsAuthenticated(), IsHrAdminOrDirector()]
        return [IsAuthenticated()]

    def get_queryset(self):
        queryset = self.queryset
        user = self.request.user

        if user.role in {UserRoles.HR, UserRoles.ADMIN, UserRoles.DIRECTOR}:
            return queryset

        if user.role == UserRoles.MANAGER:
            return queryset.filter(assigned_to=user)

        if user.role in {UserRoles.CANDIDATE, UserRoles.DRIVER, UserRoles.EMPLOYEE}:
            return queryset.filter(subject=user)

        return queryset.none()

    def get_serializer_class(self):
        if self.action == "launch":
            return LaunchEvaluationSerializer

        user = self.request.user

        if user.role in {UserRoles.CANDIDATE, UserRoles.DRIVER, UserRoles.EMPLOYEE}:
            return SubjectEvaluationSerializer

        return EvaluationSerializer

    @action(detail=False, methods=["post"], url_path="launch")
    def launch(self, request):
        serializer = LaunchEvaluationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        evaluation = serializer.save()
        output = EvaluationSerializer(evaluation)
        return Response(output.data, status=status.HTTP_201_CREATED)
