from django.db import models


class GridStage(models.TextChoices):
    SOFT = "soft", "Soft skills"
    HARD = "hard", "Hard skills"
    FULL = "full", "Full evaluation"


class GridScope(models.TextChoices):
    CANDIDATE = "candidate", "Candidate"
    EMPLOYEE = "employee", "Employee"
    BOTH = "both", "Both"


class PositionTemplatePolicy(models.Model):
    position = models.ForeignKey(
        "positions.Position",
        on_delete=models.CASCADE,
        related_name="template_policies",
    )

    # Points to logical Template (authoring); evaluation snapshots latest published TemplateVersion
    template = models.ForeignKey(
        "templates_grid.Template",
        on_delete=models.PROTECT,
        related_name="position_policies",
    )

    stage = models.CharField(max_length=10, choices=GridStage.choices, default=GridStage.FULL)
    scope = models.CharField(max_length=10, choices=GridScope.choices, default=GridScope.BOTH)

    effective_from = models.DateField()
    effective_to = models.DateField(null=True, blank=True)

    is_active = models.BooleanField(default=True)

    set_by = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="set_position_template_policies",
    )
    set_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["position", "stage", "scope", "is_active"]),
            models.Index(fields=["effective_from"]),
        ]
        constraints = [
            # At most one active policy per key (position+stage+scope)
            models.UniqueConstraint(
                fields=["position", "stage", "scope"],
                condition=models.Q(is_active=True),
                name="uniq_active_policy_per_position_stage_scope",
            )
        ]

    def __str__(self) -> str:
        return f"{self.position} -> {self.template} ({self.stage}/{self.scope})"