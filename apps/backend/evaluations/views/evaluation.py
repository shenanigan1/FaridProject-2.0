from rest_framework import status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from evaluations.models.evaluation import Evaluation
from evaluations.serializers import (
    EvaluationSerializer,
    EvaluationQuestionnaireUpdateSerializer,
    LaunchEvaluationSerializer,
    SubjectEvaluationSerializer,
    build_questionnaire_payload,
)
from templates_grid.models import SkillQuestion
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
        evaluations = serializer.save()
        output = EvaluationSerializer(evaluations, many=True)
        return Response(output.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["get"], url_path="questionnaire")
    def questionnaire(self, request, pk=None):
        evaluation = self.get_object()
        payload = build_questionnaire_payload(evaluation)
        return Response(payload, status=status.HTTP_200_OK)

    @questionnaire.mapping.post
    def save_questionnaire(self, request, pk=None):
        evaluation = self.get_object()
        serializer = EvaluationQuestionnaireUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        allowed_question_ids = set(
            SkillQuestion.objects.filter(
                pool_id__in=evaluation.template_version.template.pool_rules.values_list(
                    "pool_id", flat=True
                )
            ).values_list("id", flat=True)
        )

        for answer in serializer.validated_data["answers"]:
            question_id = answer["question_id"]
            if question_id not in allowed_question_ids:
                return Response(
                    {"answers": [f"Question {question_id} does not belong to this template."]},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            candidate_answer = answer.get("candidate_answer", "")
            manager_comment = answer.get("manager_comment", "")
            score = answer.get("score")

            response, _ = evaluation.responses.get_or_create(question_id=question_id)
            response.candidate_answer = candidate_answer
            response.manager_comment = manager_comment
            response.score = score
            response.save()

        payload = build_questionnaire_payload(evaluation)
        return Response(payload, status=status.HTTP_200_OK)
