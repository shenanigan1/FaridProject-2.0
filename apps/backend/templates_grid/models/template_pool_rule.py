from django.db import models

class TemplatePoolRule(models.Model):
    template = models.ForeignKey("templates_grid.Template", on_delete=models.CASCADE, related_name="pool_rules")
    section = models.ForeignKey("templates_grid.TemplateSection", on_delete=models.CASCADE, related_name="pool_rules")

    pool = models.ForeignKey("templates_grid.QuestionPool", on_delete=models.PROTECT, related_name="template_rules")

    random_count = models.PositiveIntegerField(default=0)  # draw N random (non-mandatory) questions
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order", "id"]
        constraints = [
            models.UniqueConstraint(fields=["template", "pool"], name="uniq_template_pool_rule"),
        ]
        indexes = [
            models.Index(fields=["template", "order"]),
            models.Index(fields=["section", "order"]),
        ]

    def __str__(self) -> str:
        return f"{self.template} / {self.pool} (random={self.random_count})"