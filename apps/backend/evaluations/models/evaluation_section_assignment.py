from django.db import models


class EvaluationSectionAssignment(models.Model):
    evaluation = models.ForeignKey(
        "evaluations.Evaluation",
        on_delete=models.CASCADE,
        related_name="section_assignments",
    )

    section = models.ForeignKey(
        "templates_grid.VersionedSection",
        on_delete=models.PROTECT,
        related_name="assignments",
    )

    assigned_to = models.ForeignKey(
        "users.User", on_delete=models.PROTECT, related_name="section_assignments"
    )

    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["evaluation", "section"], name="uniq_eval_section_assignment"
            ),
        ]
        indexes = [
            models.Index(fields=["assigned_to"]),
            models.Index(fields=["evaluation"]),
        ]

    def __str__(self) -> str:
        return f"{self.evaluation_id} — {self.section.name} -> {self.assigned_to}"
