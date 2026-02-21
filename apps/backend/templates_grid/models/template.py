from django.db import models

class TemplateStatus(models.TextChoices):
    DRAFT = "draft", "Draft"
    PUBLISHED = "published", "Published"
    ARCHIVED = "archived", "Archived"


class SkillType(models.TextChoices):
    SOFT = "soft", "Soft Skill"
    HARD = "hard", "Hard Skill"


# ----------------------------
# Authoring layer (editable)
# ----------------------------

class Template(models.Model):
    name = models.CharField(max_length=255)
    status = models.CharField(max_length=20, choices=TemplateStatus.choices, default=TemplateStatus.DRAFT)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:
        return self.name
    
class TemplatePool(models.Model):
    template = models.ForeignKey("templates_grid.Template", on_delete=models.CASCADE, related_name="template_pools")
    pool = models.ForeignKey("templates_grid.QuestionPool", on_delete=models.PROTECT, related_name="template_links")
    order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["template", "pool"], name="uniq_pool_per_template"),
        ]
        ordering = ["order", "id"]


# ----------------------------
# Published layer (immutable)
# ----------------------------

class TemplateVersion(models.Model):
    template = models.ForeignKey("templates_grid.Template", on_delete=models.PROTECT, related_name="versions")
    version = models.PositiveIntegerField()

    published_at = models.DateTimeField(auto_now_add=True)
    published_by = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="published_template_versions",
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["template", "version"], name="uniq_template_version"),
        ]
        ordering = ["-version", "-published_at"]

    def __str__(self) -> str:
        return f"{self.template.name} v{self.version}"