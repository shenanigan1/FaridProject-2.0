# templates_grid/models/template.py
from django.db import models

class Template(models.Model):
    name = models.CharField(max_length=255)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [models.Index(fields=["is_active"])]

    def __str__(self) -> str:
        return self.name