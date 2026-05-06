from django.db import models


class Position(models.Model):
    company = models.ForeignKey(
        "companies.Company", on_delete=models.PROTECT, related_name="positions"
    )

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)

    department = models.CharField(max_length=255)
    contract_type = models.CharField(max_length=100)

    location = models.CharField(max_length=255, blank=True)
    salary = models.PositiveIntegerField(null=True, blank=True)

    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["company", "is_active"]),
            models.Index(fields=["department"]),
            models.Index(fields=["contract_type"]),
        ]

    def __str__(self) -> str:
        return self.title
