from django.utils import timezone
from rest_framework import serializers, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from evaluations.models import EvaluationQuestion, SkillAnswer
from evaluations.models.evaluation import Evaluation
from evaluations.serializers import AssignEvaluationSerializer, EvaluationSerializer
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
        if self.action == "assign_test":
            return [IsAuthenticated(), IsHrAdminOrDirector()]
        return [IsAuthenticated()]

    def _is_hr_admin_or_director(self, user) -> bool:
        return bool(
            user
            and user.is_authenticated
            and user.role in {UserRoles.HR, UserRoles.ADMIN, UserRoles.DIRECTOR}
        )

    @action(detail=False, methods=["post"], url_path="assign-test")
    def assign_test(self, request):
        serializer = AssignEvaluationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        evaluation = serializer.save()
        return Response(
            EvaluationSerializer(evaluation).data, status=status.HTTP_201_CREATED
        )

    @action(detail=True, methods=["get"], url_path="questions")
    def questions(self, request, pk=None):
        evaluation = self.get_object()
        can_access = request.user.id in {
            evaluation.subject_id,
            evaluation.assigned_to_id,
        } or self._is_hr_admin_or_director(request.user)
        if not can_access:
            raise PermissionDenied(
                "You do not have permission to view these questions."
            )

        questions = (
            evaluation.questions.select_related("question", "section")
            .prefetch_related("answer")
            .all()
            .order_by("order", "id")
        )
        data = [
            {
                "evaluation_question_id": item.id,
                "order": item.order,
                "is_mandatory": item.is_mandatory,
                "section": item.section.name,
                "question_label": item.question.label,
                "question_type": item.question.type,
                "min_score": item.question.min_score,
                "max_score": item.question.max_score,
                "answer": item.answer.value if hasattr(item, "answer") else None,
            }
            for item in questions
        ]
        return Response(data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], url_path="submit-answers")
    def submit_answers(self, request, pk=None):
        evaluation = self.get_object()
        if request.user.id != evaluation.subject_id:
            raise PermissionDenied("Only the evaluation subject can submit answers.")

        answers = request.data.get("answers", [])
        if not isinstance(answers, list) or not answers:
            raise serializers.ValidationError(
                {"answers": "This field must be a non-empty list."}
            )

        updated_count = 0
        for answer in answers:
            evaluation_question_id = answer.get("evaluation_question_id")
            value = answer.get("value")

            if evaluation_question_id is None or value is None:
                raise serializers.ValidationError(
                    {
                        "answers": (
                            "Each answer item must include evaluation_question_id and value."
                        )
                    }
                )

            evaluation_question = EvaluationQuestion.objects.filter(
                id=evaluation_question_id,
                evaluation_id=evaluation.id,
            ).first()
            if evaluation_question is None:
                raise serializers.ValidationError(
                    {
                        "answers": f"Invalid evaluation_question_id: {evaluation_question_id}"
                    }
                )

            skill_answer, _ = SkillAnswer.objects.update_or_create(
                evaluation_question=evaluation_question,
                defaults={"value": value},
            )
            skill_answer.full_clean()
            skill_answer.save()
            updated_count += 1

        total_questions = evaluation.questions.count()
        answered_questions = SkillAnswer.objects.filter(
            evaluation_question__evaluation_id=evaluation.id
        ).count()
        if total_questions > 0 and answered_questions == total_questions:
            evaluation.status = "completed"
            evaluation.completed_at = timezone.now()
            evaluation.save(update_fields=["status", "completed_at", "updated_at"])

        return Response(
            {
                "updated_answers": updated_count,
                "answered_questions": answered_questions,
                "total_questions": total_questions,
                "status": evaluation.status,
            },
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=["post"], url_path="manager-validate")
    def manager_validate(self, request, pk=None):
        evaluation = self.get_object()
        can_validate = (
            request.user.id == evaluation.assigned_to_id
            or self._is_hr_admin_or_director(request.user)
        )
        if not can_validate:
            raise PermissionDenied(
                "Only assigned manager or HR can validate this evaluation."
            )

        if evaluation.status != "completed":
            raise serializers.ValidationError(
                {"status": "Evaluation must be completed before validation."}
            )

        internal_comment = request.data.get("internal_comment")
        subject_comment = request.data.get("subject_comment")
        if internal_comment is not None:
            evaluation.internal_comment = str(internal_comment)
        if subject_comment is not None:
            evaluation.subject_comment = str(subject_comment)

        evaluation.status = "validated"
        evaluation.validated_at = timezone.now()
        evaluation.save(
            update_fields=[
                "status",
                "validated_at",
                "internal_comment",
                "subject_comment",
                "updated_at",
            ]
        )
        return Response(
            EvaluationSerializer(evaluation).data, status=status.HTTP_200_OK
        )
