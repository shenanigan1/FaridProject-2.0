from django.db import models
from .question_pool import QuestionPool

class Template(models.Model):
    name = models.CharField(max_length=255)
    pools = models.ManyToManyField(QuestionPool, related_name="templates")

    def __str__(self):
        return self.name
