from django.db import models
from candidates.models import Candidate
from templates_grid.models import Template
from users.models import User


class EvaluationStatus(models.TextChoices):
    IN_PROGRESS = "in_progress", "In progress"
    COMPLETED = "completed", "Completed"
    VALIDATED = "validated", "Validated"


class Evaluation(models.Model):
    candidate = models.ForeignKey(
        Candidate,
        on_delete=models.CASCADE,
        related_name="evaluations",
    )
    template = models.ForeignKey(
        Template,
        on_delete=models.CASCADE,
        related_name="evaluations",
    )
    assigned_to = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name="assigned_evaluations",
    )

    status = models.CharField(
        max_length=20,
        choices=EvaluationStatus.choices,
        default=EvaluationStatus.IN_PROGRESS,
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Evaluation #{self.id} — {self.candidate} — {self.status}"
