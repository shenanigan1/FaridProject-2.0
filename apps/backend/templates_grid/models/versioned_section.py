from django.db import models

class VersionedSection(models.Model):
    template_version = models.ForeignKey("templates_grid.TemplateVersion", on_delete=models.CASCADE, related_name="sections")
    name = models.CharField(max_length=255)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order", "id"]
        indexes = [models.Index(fields=["template_version", "order"])]

    def __str__(self) -> str:
        return f"{self.name} ({self.template_version})"