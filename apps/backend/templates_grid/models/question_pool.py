from django.db import models


class QuestionPool(models.Model):
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)

    def __str__(self) -> str:
        return self.name
    
class VersionedPool(models.Model):
    template_version = models.ForeignKey(
        "templates_grid.TemplateVersion",
        on_delete=models.CASCADE,
        related_name="pools",
    )

    name = models.CharField(max_length=255)
    code = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ["order", "id"]
        indexes = [
            models.Index(fields=["template_version", "order"]),
        ]

    def __str__(self) -> str:
        return f"{self.template_version} — {self.name}"