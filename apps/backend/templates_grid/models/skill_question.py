from django.db import models
from django.db.models import Q


class QuestionFormat(models.TextChoices):
    MCQ = "mcq", "Multiple Choice"
    TRUE_FALSE = "true_false", "True/False"
    YES_NO = "yes_no", "Yes/No"
    FREE_TEXT = "free_text", "Free text"
    RATING = "rating", "Rating"
    PRACTICAL = "practical", "Practical"


class Difficulty(models.TextChoices):
    EASY = "easy", "Easy"
    INTERMEDIATE = "intermediate", "Intermediate"
    HARD = "hard", "Hard"


class SkillQuestion(models.Model):
    pool = models.ForeignKey(
        "templates_grid.QuestionPool",
        on_delete=models.CASCADE,
        related_name="questions",
    )

    format = models.CharField(
        max_length=20,
        choices=QuestionFormat.choices,
        default=QuestionFormat.MCQ,
    )

    title = models.CharField(max_length=255, blank=True, default="")
    text = models.TextField()

    explanation = models.TextField(blank=True, default="")

    is_mandatory = models.BooleanField(default=False)
    points = models.PositiveIntegerField(default=10)
    difficulty = models.CharField(
        max_length=20,
        choices=Difficulty.choices,
        default=Difficulty.INTERMEDIATE,
    )

    rubric = models.JSONField(blank=True, default=dict)  # for practical grading

    order = models.PositiveIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["order", "id"]
        indexes = [
            models.Index(fields=["pool", "format"]),
            models.Index(fields=["pool", "order"]),
        ]
        constraints = [
            models.CheckConstraint(
                condition=Q(points__gte=1), name="ck_question_points_gte_1"
            ),
        ]

    def __str__(self):
        return f"{self.format.upper()} — {self.title or self.text[:50]}"
