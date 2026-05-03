from django.db.models import Q
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from evaluations.models.evaluation import Evaluation
from evaluations.models.evaluation import EvaluationStatus
from evaluations.serializers import (
    EvaluationSerializer,
    EvaluationQuestionnaireUpdateSerializer,
    LaunchEvaluationSerializer,
    SubjectEvaluationSerializer,
    build_questionnaire_payload,
)
from templates_grid.models import SkillQuestion
from users.models import User, UserRoles
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
            return queryset.filter(
                Q(assigned_to=user) | Q(section_assignments__assigned_to=user)
            ).distinct()

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

    @action(detail=False, methods=["get"], url_path="managers")
    def managers(self, request):
        query = request.query_params.get("q", "").strip()
        managers = User.objects.filter(role=UserRoles.MANAGER, is_active=True).order_by(
            "first_name", "last_name", "email"
        )
        if query:
            managers = managers.filter(
                Q(first_name__icontains=query)
                | Q(last_name__icontains=query)
                | Q(email__icontains=query)
            )
        payload = [
            {
                "id": manager.id,
                "full_name": manager.full_name or manager.email,
                "email": manager.email,
            }
            for manager in managers
        ]
        return Response(payload, status=status.HTTP_200_OK)

    @action(detail=True, methods=["get"], url_path="questionnaire")
    def questionnaire(self, request, pk=None):
        evaluation = self.get_object()
        payload = build_questionnaire_payload(evaluation, request.user)
        return Response(payload, status=status.HTTP_200_OK)

    @questionnaire.mapping.post
    def save_questionnaire(self, request, pk=None):
        evaluation = self.get_object()
        serializer = EvaluationQuestionnaireUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payload_scope = build_questionnaire_payload(evaluation, request.user)
        allowed_question_ids = {
            question["question_id"]
            for section in payload_scope["sections"]
            for question in section["questions"]
        }
        allowed_section_ids = {
            section["section_id"] for section in payload_scope["sections"]
        }

        allowed_questions = {
            question.id: question
            for question in SkillQuestion.objects.filter(
                id__in=allowed_question_ids
            ).only("id", "points", "is_mandatory")
        }

        if "test_manager_comment" in serializer.validated_data:
            evaluation.internal_comment = serializer.validated_data[
                "test_manager_comment"
            ]
            evaluation.save(update_fields=["internal_comment", "updated_at"])

        section_assignments = {
            (assignment.section.name, assignment.section.order): assignment
            for assignment in evaluation.section_assignments.select_related(
                "section"
            ).all()
        }
        template_sections = {
            section.id: section
            for section in evaluation.template_version.template.sections.all()
        }

        for section_input in serializer.validated_data.get("section_comments", []):
            section_id = section_input["section_id"]
            if section_id not in allowed_section_ids:
                return Response(
                    {"sections": [f"Section {section_id} is not assigned to you."]},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            template_section = template_sections.get(section_id)
            if template_section is None:
                return Response(
                    {"sections": [f"Unknown section {section_id}."]},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            assignment = section_assignments.get(
                (template_section.name, template_section.order)
            )
            if assignment is None:
                continue
            assignment.manager_comment = section_input.get("manager_comment", "")
            if section_input.get("completed"):
                assignment.completed_at = timezone.now()
            assignment.save(update_fields=["manager_comment", "completed_at"])

        for answer in serializer.validated_data.get("answers", []):
            question_id = answer["question_id"]
            question = allowed_questions.get(question_id)
            if question is None:
                return Response(
                    {
                        "answers": [
                            f"Question {question_id} does not belong to this template."
                        ]
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
            candidate_answer = answer.get("candidate_answer", "")
            manager_comment = answer.get("manager_comment", "")
            score = answer.get("score")
            if (
                serializer.validated_data.get("complete_sections")
                and question.is_mandatory
                and not candidate_answer.strip()
            ):
                return Response(
                    {"answers": [f"Question {question_id} requires an answer."]},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if score is not None and (score < 0 or score > question.points):
                return Response(
                    {
                        "answers": [
                            f"Question {question_id} score must be between 0 and {question.points}."
                        ]
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            response, _ = evaluation.responses.get_or_create(question_id=question_id)
            response.candidate_answer = candidate_answer
            response.manager_comment = manager_comment
            response.score = score
            response.save()

        if serializer.validated_data.get("complete_sections"):
            now = timezone.now()
            for section in payload_scope["sections"]:
                if section["section_id"] not in allowed_section_ids:
                    continue
                template_section = template_sections.get(section["section_id"])
                if template_section is None:
                    continue
                assignment = section_assignments.get(
                    (template_section.name, template_section.order)
                )
                if assignment is not None and assignment.completed_at is None:
                    assignment.completed_at = now
                    assignment.save(update_fields=["completed_at"])

        all_assignments = list(evaluation.section_assignments.all())
        if all_assignments and all(
            assignment.completed_at is not None for assignment in all_assignments
        ):
            evaluation.status = EvaluationStatus.COMPLETED
            evaluation.completed_at = evaluation.completed_at or timezone.now()
            evaluation.save(update_fields=["status", "completed_at", "updated_at"])

        payload = build_questionnaire_payload(evaluation, request.user)
        return Response(payload, status=status.HTTP_200_OK)
