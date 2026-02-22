# farid_tests/unit/test_employees_models.py
import pytest
from django.db import IntegrityError

from farid_tests.factories.employees import EmployeeFactory

pytestmark = pytest.mark.django_db


def test_employee_str_contains_user():
    emp = EmployeeFactory.create(email="emp1@example.com", employee_number="EMP-1000")
    s = str(emp)
    assert "Employee" in s or "emp1@example.com" in s


def test_employee_number_unique():
    EmployeeFactory.create(email="emp2@example.com", employee_number="EMP-42")
    with pytest.raises(IntegrityError):
        EmployeeFactory.create(email="emp3@example.com", employee_number="EMP-42")