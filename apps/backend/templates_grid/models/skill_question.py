from django.db import models
from .question_pool import QuestionPool


class SkillType(models.TextChoices):
    SOFT = "soft", "Soft Skill"
    HARD = "hard", "Hard Skill"


class SkillQuestion(models.Model):
    pool = models.ForeignKey(
        QuestionPool,
        on_delete=models.CASCADE,
        related_name="questions"
    )
    label = models.CharField(max_length=255)
    type = models.CharField(max_length=10, choices=SkillType.choices)

    def __str__(self):
        return f"{self.type.upper()} — {self.label}"
