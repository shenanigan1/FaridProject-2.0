from django.db import models
from django.core.validators import MinValueValidator


class SkillType(models.TextChoices):
    SOFT = "soft", "Soft Skill"
    HARD = "hard", "Hard Skill"


class SkillQuestion(models.Model):
    pool = models.ForeignKey("templates_grid.QuestionPool", on_delete=models.CASCADE, related_name="questions")

    label = models.CharField(max_length=255)
    type = models.CharField(max_length=10, choices=SkillType.choices)

    min_score = models.PositiveSmallIntegerField(default=0, validators=[MinValueValidator(0)])
    max_score = models.PositiveSmallIntegerField(default=5, validators=[MinValueValidator(1)])
    weight = models.PositiveSmallIntegerField(default=1, validators=[MinValueValidator(1)])

    is_active = models.BooleanField(default=True)

    def __str__(self) -> str:
        return f"{self.type.upper()} — {self.label}"
    
class VersionedQuestion(models.Model):
    versioned_pool = models.ForeignKey(
        "templates_grid.VersionedPool",
        on_delete=models.CASCADE,
        related_name="questions",
    )

    label = models.CharField(max_length=255)
    type = models.CharField(max_length=10, choices=SkillType.choices)

    min_score = models.PositiveSmallIntegerField(default=0, validators=[MinValueValidator(0)])
    max_score = models.PositiveSmallIntegerField(default=5, validators=[MinValueValidator(1)])
    weight = models.PositiveSmallIntegerField(default=1, validators=[MinValueValidator(1)])

    order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ["order", "id"]
        indexes = [
            models.Index(fields=["versioned_pool", "order"]),
        ]

    def __str__(self) -> str:
        return f"{self.versioned_pool.template_version} — {self.type.upper()} — {self.label}"