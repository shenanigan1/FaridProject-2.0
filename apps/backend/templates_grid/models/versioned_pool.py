from django.db import models

class VersionedPool(models.Model):
    template_version = models.ForeignKey("templates_grid.TemplateVersion", on_delete=models.CASCADE, related_name="pools")
    section = models.ForeignKey("templates_grid.VersionedSection", on_delete=models.CASCADE, related_name="pools")

    name = models.CharField(max_length=255)
    code = models.CharField(max_length=100)

    random_count = models.PositiveIntegerField(default=0)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order", "id"]
        indexes = [
            models.Index(fields=["template_version", "order"]),
            models.Index(fields=["section", "order"]),
        ]

    def __str__(self) -> str:
        return f"{self.name} ({self.template_version})"