from django.db import transaction
from rest_framework import serializers

from evaluations.models import Evaluation
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

        return Evaluation.objects.create(
            subject=application.candidate.user,
            application=application,
            position=application.position,
            template_version=template_version,
            assigned_to=evaluator,
            status="in_progress",
        )
