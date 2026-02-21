from django.core.validators import MinValueValidator
from django.db import models


class EvaluationStatus(models.TextChoices):
    DRAFT = "draft", "Draft"
    STARTED = "started", "Started"
    SOFT_DONE = "soft_done", "Soft done"
    HARD_DONE = "hard_done", "Hard done"
    VALIDATED = "validated", "Validated"
    ARCHIVED = "archived", "Archived"


class Evaluation(models.Model):
    # Subject: exactly one of candidate/employee
    candidate = models.ForeignKey(
        "candidates.Candidate",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="evaluations",
    )
    employee = models.ForeignKey(
        "employees.Employee",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="evaluations",
    )

    position = models.ForeignKey(
        "positions.Position",
        on_delete=models.PROTECT,
        related_name="evaluations",
    )

    template_version = models.ForeignKey(
        "templates_grid.TemplateVersion",
        on_delete=models.PROTECT,
        related_name="evaluations",
    )

    assigned_to = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_evaluations",
    )

    status = models.CharField(max_length=20, choices=EvaluationStatus.choices, default=EvaluationStatus.DRAFT)

    notes = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    validated_at = models.DateTimeField(null=True, blank=True)
    anonymized_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["status", "created_at"]),
            models.Index(fields=["position", "created_at"]),
        ]
        constraints = [
            # exactly one subject must be set
            models.CheckConstraint(
                condition=(
                    (models.Q(candidate__isnull=False) & models.Q(employee__isnull=True)) |
                    (models.Q(candidate__isnull=True) & models.Q(employee__isnull=False))
                ),
    name="chk_exactly_one_subject",
),
        ]

    def __str__(self) -> str:
        subject = self.candidate or self.employee
        return f"Evaluation #{self.id} — {subject} — {self.status}"


