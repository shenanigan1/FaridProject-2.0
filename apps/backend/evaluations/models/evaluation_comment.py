from django.conf import settings
from django.db import models

class EvaluationComment(models.Model):
    evaluation = models.ForeignKey("evaluations.Evaluation", on_delete=models.CASCADE, related_name="comments")
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)

    text = models.TextField()
    is_visible_to_subject = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["evaluation", "created_at"]),
            models.Index(fields=["is_visible_to_subject"]),
        ]

    def __str__(self) -> str:
        return f"Comment on eval {self.evaluation_id}"