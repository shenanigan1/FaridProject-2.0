from django.core.exceptions import ValidationError
from django.db import models


class SkillAnswer(models.Model):
    evaluation_question = models.OneToOneField(
        "evaluations.EvaluationQuestion",
        on_delete=models.CASCADE,
        related_name="answer",
    )

    value = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["created_at"]),
        ]

    def clean(self):
        super().clean()
        q = self.evaluation_question.question if self.evaluation_question_id else None
        if not q or self.value is None:
            return
        if self.value < q.min_score or self.value > q.max_score:
            raise ValidationError(
                {"value": f"Value must be between {q.min_score} and {q.max_score}."}
            )

    def __str__(self) -> str:
        return f"{self.evaluation_question_id} = {self.value}"
