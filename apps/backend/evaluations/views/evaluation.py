from rest_framework import status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from evaluations.models.evaluation import Evaluation
from evaluations.serializers import AssignEvaluationSerializer, EvaluationSerializer
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
        if self.action == "assign_test":
            return [IsAuthenticated(), IsHrAdminOrDirector()]
        return [IsAuthenticated()]

    @action(detail=False, methods=["post"], url_path="assign-test")
    def assign_test(self, request):
        serializer = AssignEvaluationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        evaluation = serializer.save()
        return Response(
            EvaluationSerializer(evaluation).data, status=status.HTTP_201_CREATED
        )
