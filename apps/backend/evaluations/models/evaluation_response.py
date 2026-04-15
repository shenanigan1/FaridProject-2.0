from django.db import models


class EvaluationResponse(models.Model):
    evaluation = models.ForeignKey(
        "evaluations.Evaluation",
        on_delete=models.CASCADE,
        related_name="responses",
    )
    question = models.ForeignKey(
        "templates_grid.SkillQuestion",
        on_delete=models.PROTECT,
        related_name="evaluation_responses",
    )
    candidate_answer = models.TextField(blank=True, default="")
    manager_comment = models.TextField(blank=True, default="")
    score = models.IntegerField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["evaluation", "question"],
                name="uniq_evaluation_response_question",
            ),
        ]
        indexes = [
            models.Index(fields=["evaluation", "updated_at"]),
        ]

    def __str__(self) -> str:
        return f"Eval {self.evaluation_id} / Q {self.question_id}"
