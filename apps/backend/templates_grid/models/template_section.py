from django.db import models

class TemplateSection(models.Model):
    template = models.ForeignKey("templates_grid.Template", on_delete=models.CASCADE, related_name="sections")
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, default="")
    weight = models.PositiveIntegerField(default=0)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order", "id"]
        constraints = [
            models.UniqueConstraint(fields=["template", "name"], name="uniq_section_name_per_template"),
        ]

    def __str__(self) -> str:
        return f"{self.template} / {self.name}"