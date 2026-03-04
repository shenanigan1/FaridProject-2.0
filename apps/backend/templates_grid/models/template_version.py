from django.db import models


class TemplateVersion(models.Model):
    template = models.ForeignKey(
        "templates_grid.Template", on_delete=models.PROTECT, related_name="versions"
    )
    version = models.PositiveIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["template", "version"], name="uniq_template_version"
            ),
        ]
        indexes = [models.Index(fields=["template", "version"])]

    def __str__(self) -> str:
        return f"{self.template.name} v{self.version}"
