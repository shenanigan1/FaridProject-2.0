from django.db import models


class ContractType(models.TextChoices):
    CDI = "cdi", "CDI"
    CDD = "cdd", "CDD"
    INTERIM = "interim", "Interim"
    OTHER = "other", "Other"


class Position(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    department = models.CharField(max_length=255)

    contract_type = models.CharField(max_length=20, choices=ContractType.choices, default=ContractType.OTHER)

    # External reference (HR/ERP)
    external_company_id = models.IntegerField()

    location = models.CharField(max_length=255, blank=True)
    salary = models.IntegerField(null=True, blank=True)

    is_active = models.BooleanField(default=True)

    def __str__(self) -> str:
        return self.title