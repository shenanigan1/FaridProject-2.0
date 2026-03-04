from django.conf import settings
from django.db import models


class EvaluationStatus(models.TextChoices):
    IN_PROGRESS = "in_progress", "In progress"
    COMPLETED = "completed", "Completed"
    VALIDATED = "validated", "Validated"


class Evaluation(models.Model):
    subject = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="evaluations"
    )

    # For candidates: link to application (recommended). For employees: can be null.
    application = models.ForeignKey(
        "recruitment.JobApplication",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="evaluations",
    )

    position = models.ForeignKey(
        "positions.Position",
        on_delete=models.PROTECT,
        related_name="evaluations",
        null=True,
        blank=True,
    )

    template_version = models.ForeignKey(
        "templates_grid.TemplateVersion",
        on_delete=models.PROTECT,
        related_name="evaluations",
    )

    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_evaluations",
    )

    status = models.CharField(
        max_length=20,
        choices=EvaluationStatus.choices,
        default=EvaluationStatus.IN_PROGRESS,
    )

    # Results visibility
    subject_comment = models.TextField(blank=True)  # visible to candidate/employee
    internal_comment = models.TextField(blank=True)  # HR/management only

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    completed_at = models.DateTimeField(null=True, blank=True)
    validated_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["status", "created_at"]),
            models.Index(fields=["subject", "created_at"]),
            models.Index(fields=["position", "created_at"]),
        ]

    def __str__(self) -> str:
        return f"Evaluation #{self.id} — {self.subject} — {self.status}"
