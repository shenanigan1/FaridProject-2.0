from django.db import models

class EvaluationQuestion(models.Model):
    evaluation = models.ForeignKey("evaluations.Evaluation", on_delete=models.CASCADE, related_name="questions")
    question = models.ForeignKey("templates_grid.VersionedQuestion", on_delete=models.PROTECT, related_name="evaluation_questions")

    section = models.ForeignKey("templates_grid.VersionedSection", on_delete=models.PROTECT, related_name="evaluation_questions")

    is_mandatory = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order", "id"]
        constraints = [
            models.UniqueConstraint(fields=["evaluation", "question"], name="uniq_eval_question"),
        ]
        indexes = [
            models.Index(fields=["evaluation", "order"]),
            models.Index(fields=["section", "order"]),
        ]

    def __str__(self) -> str:
        return f"{self.evaluation_id} — {self.question.label}"