from django.db import models


class ApplicationStatus(models.TextChoices):
    APPLIED = "applied", "Applied"
    IN_REVIEW = "in_review", "In review"
    INTERVIEW = "interview", "Interview"
    OFFERED = "offered", "Offered"
    HIRED = "hired", "Hired"
    REJECTED = "rejected", "Rejected"


class JobApplication(models.Model):
    candidate = models.ForeignKey(
        "candidates.Candidate", on_delete=models.PROTECT, related_name="applications"
    )
    position = models.ForeignKey(
        "positions.Position", on_delete=models.PROTECT, related_name="applications"
    )
    assigned_template = models.ForeignKey(
        "templates_grid.Template",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="job_applications",
    )

    status = models.CharField(
        max_length=20,
        choices=ApplicationStatus.choices,
        default=ApplicationStatus.APPLIED,
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["candidate", "position"],
                name="uniq_candidate_position_application",
            ),
        ]
        indexes = [
            models.Index(fields=["position", "status"]),
            models.Index(fields=["candidate", "status"]),
        ]

    def __str__(self) -> str:
        return f"{self.candidate} -> {self.position} ({self.status})"
