from django.db import models


class DrivingSession(models.Model):
    evaluation = models.OneToOneField(
        "evaluations.Evaluation",
        on_delete=models.CASCADE,
        related_name="driving_session",
    )

    vehicle = models.CharField(max_length=255, blank=True)
    route = models.CharField(max_length=255, blank=True)

    started_at = models.DateTimeField(null=True, blank=True)
    ended_at = models.DateTimeField(null=True, blank=True)

    notes = models.TextField(blank=True)

    def __str__(self) -> str:
        return f"DrivingSession for eval {self.evaluation_id}"
