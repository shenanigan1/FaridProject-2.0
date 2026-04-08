import random

from django.db import transaction
from rest_framework import serializers

from evaluations.models import (
    Evaluation,
    EvaluationQuestion,
    EvaluationSectionAssignment,
)
from recruitment.models import JobApplication
from templates_grid.models import Template, TemplateVersion
from users.models import User, UserRoles


class AssignTestToApplicationService:
    @staticmethod
    @transaction.atomic
    def execute(
        *,
        application_id: int,
        evaluator_id: int,
        template_id: int | None = None,
    ) -> Evaluation:
        application = (
            JobApplication.objects.select_related(
                "candidate__user", "position", "assigned_template"
            )
            .filter(id=application_id)
            .first()
        )
        if application is None:
            raise serializers.ValidationError(
                {"application_id": "Invalid application_id"}
            )

        evaluator = User.objects.filter(id=evaluator_id).first()
        if evaluator is None:
            raise serializers.ValidationError({"evaluator_id": "Invalid evaluator_id"})
        if evaluator.role != UserRoles.MANAGER:
            raise serializers.ValidationError(
                {"evaluator_id": "Evaluator must have manager role"}
            )

        template = None
        if template_id is not None:
            template = Template.objects.filter(id=template_id).first()
            if template is None:
                raise serializers.ValidationError(
                    {"template_id": "Invalid template_id"}
                )
        else:
            template = application.assigned_template

        if template is None:
            raise serializers.ValidationError(
                {"template_id": "No template assigned to this application"}
            )

        template_version = (
            TemplateVersion.objects.filter(template=template)
            .order_by("-version")
            .first()
        )
        if template_version is None:
            raise serializers.ValidationError(
                {"template_id": "Template has no available version"}
            )

        existing = Evaluation.objects.filter(
            application_id=application.id,
            status="in_progress",
        ).first()
        if existing:
            return existing

        evaluation = Evaluation.objects.create(
            subject=application.candidate.user,
            application=application,
            position=application.position,
            template_version=template_version,
            assigned_to=evaluator,
            status="in_progress",
        )
        AssignTestToApplicationService._materialize_questions_and_section_assignments(
            evaluation=evaluation,
            evaluator=evaluator,
        )
        return evaluation

    @staticmethod
    def _materialize_questions_and_section_assignments(
        *,
        evaluation: Evaluation,
        evaluator: User,
    ) -> None:
        sections = evaluation.template_version.sections.all().order_by("order", "id")
        next_order = 0

        for section in sections:
            EvaluationSectionAssignment.objects.create(
                evaluation=evaluation,
                section=section,
                assigned_to=evaluator,
            )

            pools = section.pools.all().order_by("order", "id")
            for pool in pools:
                mandatory_questions = list(
                    pool.questions.filter(is_mandatory=True).order_by("order", "id")
                )
                optional_questions = list(
                    pool.questions.filter(is_mandatory=False).order_by("order", "id")
                )

                if len(optional_questions) < pool.random_count:
                    raise serializers.ValidationError(
                        {
                            "template_id": (
                                f"Pool '{pool.name}' does not have enough optional "
                                f"questions (required={pool.random_count}, "
                                f"available={len(optional_questions)})."
                            )
                        }
                    )

                selected_optional = random.sample(optional_questions, pool.random_count)
                selected_questions = mandatory_questions + selected_optional
                selected_questions.sort(
                    key=lambda question: (question.order, question.id)
                )

                for question in selected_questions:
                    EvaluationQuestion.objects.create(
                        evaluation=evaluation,
                        question=question,
                        section=section,
                        is_mandatory=question.is_mandatory,
                        order=next_order,
                    )
                    next_order += 1
