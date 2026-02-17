from django.db import models

class UserRoles(models.TextChoices):
    ADMIN = "admin", "Admin"
    HR = "hr", "Human Resources"
    MANAGER = "manager", "Manager"
    DIRECTOR = "director", "Director"
    EMPLOYEE = "employee", "Employee"

