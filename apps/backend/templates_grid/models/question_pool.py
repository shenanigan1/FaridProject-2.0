from django.db import models


class QuestionPool(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    code = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return self.name
