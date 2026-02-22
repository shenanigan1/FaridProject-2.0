from django.db import models
from django.db.models import Q, F

class SkillType(models.TextChoices):
    SOFT = "soft", "Soft Skill"
    HARD = "hard", "Hard Skill"

class SkillQuestion(models.Model):
    pool = models.ForeignKey("templates_grid.QuestionPool", on_delete=models.CASCADE, related_name="questions")

    label = models.CharField(max_length=255)
    type = models.CharField(max_length=10, choices=SkillType.choices)

    is_mandatory = models.BooleanField(default=False)

    min_score = models.IntegerField(default=0)
    max_score = models.IntegerField(default=5)

    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["pool_id", "order", "id"]
        indexes = [
            models.Index(fields=["pool", "type"]),
            models.Index(fields=["pool", "order"]),
        ]
        constraints = [
            models.CheckConstraint(condition=Q(min_score__lte=F("max_score")), name="ck_question_min_le_max"),
        ]

    def __str__(self) -> str:
        return f"{self.type.upper()} — {self.label}"