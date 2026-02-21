from django.db import models
from django.core.validators import MinValueValidator

class SkillAnswer(models.Model):
    evaluation = models.ForeignKey(
        "evaluations.Evaluation",
        on_delete=models.CASCADE,
        related_name="skill_answers",
    )
    question = models.ForeignKey(
        "templates_grid.VersionedQuestion",
        on_delete=models.PROTECT,
        related_name="answers",
    )

    value = models.PositiveSmallIntegerField(validators=[MinValueValidator(0)])
    comment = models.TextField(blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["evaluation", "question"], name="uniq_answer_per_eval_question"),
        ]

    def __str__(self) -> str:
        return f"{self.evaluation_id} — {self.question_id} = {self.value}"
