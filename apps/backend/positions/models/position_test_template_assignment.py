from django.core.exceptions import ValidationError
from django.db import models

from users.models import UserRoles


class PositionTestTemplateAssignment(models.Model):
    position = models.ForeignKey(
        "positions.Position",
        on_delete=models.CASCADE,
        related_name="test_template_assignments",
    )
    template = models.ForeignKey(
        "templates_grid.Template",
        on_delete=models.PROTECT,
        related_name="position_assignments",
    )
    manager = models.ForeignKey(
        "users.User",
        null=True,
        blank=True,
        on_delete=models.PROTECT,
        related_name="managed_template_assignments",
    )
    order = models.PositiveIntegerField(default=0)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["position", "template"],
                name="uniq_position_template_assignment",
            ),
        ]
        indexes = [
            models.Index(fields=["position", "order"]),
            models.Index(fields=["manager"]),
        ]

    def clean(self):
        super().clean()
        if self.manager and self.manager.role != UserRoles.MANAGER:
            raise ValidationError({"manager": "Assigned user must have manager role."})

    def __str__(self) -> str:
        return f"Position {self.position_id} -> Template {self.template_id}"
