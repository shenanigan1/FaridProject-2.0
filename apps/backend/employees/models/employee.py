from django.db import models


class Employee(models.Model):
    employee_number = models.CharField(max_length=50, unique=True)

    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)

    email = models.EmailField(null=True, blank=True)
    department = models.CharField(max_length=255, blank=True)

    position = models.ForeignKey(
        "positions.Position",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="employees",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    anonymized_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["last_name", "first_name"]),
            models.Index(fields=["employee_number"]),
            models.Index(fields=["created_at"]),
        ]

    def __str__(self) -> str:
        return f"{self.employee_number} — {self.first_name} {self.last_name}"