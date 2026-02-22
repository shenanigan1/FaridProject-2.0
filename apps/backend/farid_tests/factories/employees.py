from __future__ import annotations

from dataclasses import dataclass
from typing import Optional
import uuid

from employees.models import Employee
from farid_tests.factories.users import UserFactory


@dataclass(frozen=True)
class EmployeeFactory:
    @staticmethod
    def create(
        *,
        user=None,
        email: Optional[str] = None,
        first_name: str = "Alice",
        last_name: str = "Martin",
        phone: str = "",
        employee_number: Optional[str] = None,
        department: str = "",
    ) -> Employee:
        if employee_number is None:
            employee_number = f"EMP-{uuid.uuid4().hex[:10]}"

        if user is None:
            if email is None:
                email = f"employee-{uuid.uuid4().hex[:10]}@example.com"

            user = UserFactory.create(
                email=email,
                first_name=first_name,
                last_name=last_name,
                phone=phone,
                password=None,
            )

        return Employee.objects.create(
            user=user,
            employee_number=employee_number,
            department=department,
        )