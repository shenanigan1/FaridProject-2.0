from django.db import models


class AuditLog(models.Model):
    actor = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="audit_logs",
    )

    action = models.CharField(max_length=100)  # e.g. "TEMPLATE_PUBLISHED", "EVALUATION_VALIDATED"
    entity_type = models.CharField(max_length=100)  # e.g. "Template", "Evaluation"
    entity_id = models.CharField(max_length=64)  # keep generic (uuid/int)

    payload = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["entity_type", "entity_id"]),
            models.Index(fields=["action", "created_at"]),
        ]

    def __str__(self) -> str:
        return f"{self.action} {self.entity_type}#{self.entity_id}"