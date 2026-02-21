from django.db import models


class CandidateStatus(models.TextChoices):
    PENDING = "pending", "Pending"
    IN_REVIEW = "in_review", "In review"
    HIRED = "hired", "Hired"
    REJECTED = "rejected", "Rejected"


class Candidate(models.Model):
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)

    email = models.EmailField(null=True, blank=True)
    phone = models.CharField(max_length=20, blank=True)

    status = models.CharField(max_length=20, choices=CandidateStatus.choices, default=CandidateStatus.PENDING)

    preferred_position = models.ForeignKey(
        "positions.Position",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="preferred_by_candidates",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    anonymized_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["last_name", "first_name"]),
            models.Index(fields=["status"]),
            models.Index(fields=["created_at"]),
        ]

    def __str__(self) -> str:
        return f"{self.first_name} {self.last_name}"