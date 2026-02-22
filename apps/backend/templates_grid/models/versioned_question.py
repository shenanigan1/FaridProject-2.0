from django.db import models
from django.db.models import Q, F

class VersionedQuestion(models.Model):
    pool = models.ForeignKey("templates_grid.VersionedPool", on_delete=models.CASCADE, related_name="questions")

    label = models.CharField(max_length=255)
    type = models.CharField(max_length=10)

    is_mandatory = models.BooleanField(default=False)

    min_score = models.IntegerField(default=0)
    max_score = models.IntegerField(default=5)

    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order", "id"]
        indexes = [models.Index(fields=["pool", "order"])]
        constraints = [
            models.CheckConstraint(condition=Q(min_score__lte=F("max_score")), name="ck_vquestion_min_le_max"),
        ]

    def __str__(self) -> str:
        return self.label