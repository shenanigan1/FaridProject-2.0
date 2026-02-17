from django.db import models
from templates_grid.models import Template

class Position(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    department = models.CharField(max_length=255)
    contract_type = models.CharField(max_length=100)
    company_id = models.IntegerField()
    location = models.CharField(max_length=255, blank=True)
    salary = models.IntegerField(null=True, blank=True)
    templates = models.ManyToManyField(Template, related_name="positions", blank=True)

    def __str__(self):
        return self.title
