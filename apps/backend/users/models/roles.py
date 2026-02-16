from django.db import models

class UserRoles(models.TextChoices):
    ADMIN = "ADMIN", "Admin"
    HR = "HR", "Human Resources"
    MANAGER = "MANAGER", "Manager"
    DIRECTOR = "DIRECTOR", "Director"
    EMPLOYEE = "EMPLOYEE", "Employee"
