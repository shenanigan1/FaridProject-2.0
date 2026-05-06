# employees/models.py
from django.conf import settings
from django.db import models


class Employee(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="employee_profile",
    )

    employee_number = models.CharField(max_length=50, unique=True)
    department = models.CharField(max_length=100, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:
        return f"Employee: {self.user}"
