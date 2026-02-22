from django.conf import settings
from django.db import models

class CandidateStatus(models.TextChoices):
    PENDING = "pending", "Pending"
    IN_REVIEW = "in_review", "In review"
    HIRED = "hired", "Hired"
    REJECTED = "rejected", "Rejected"

class Candidate(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="candidate_profile")

    status = models.CharField(max_length=50, choices=CandidateStatus.choices, default=CandidateStatus.PENDING)

    target_position = models.ForeignKey(
        "positions.Position",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="targeted_by_candidates",
    )

    flag = models.BooleanField(default=False)  # keep if your tests need it

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["status"]),
            models.Index(fields=["flag"]),
        ]

    def __str__(self) -> str:
        return f"Candidate: {self.user}"