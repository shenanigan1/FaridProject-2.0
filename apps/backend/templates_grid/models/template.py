# templates_grid/models/template.py
from django.db import models

class Template(models.Model):
    name = models.CharField(max_length=255)
    is_active = models.BooleanField(default=True)

    difficulty = models.CharField(max_length=10, choices=[("easy","easy"),("medium","medium"),("hard","hard")], default="medium")
    duration_minutes = models.PositiveIntegerField(default=45)
    min_pass_score = models.PositiveIntegerField(default=80)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [models.Index(fields=["is_active"])]

    def __str__(self) -> str:
        return self.name