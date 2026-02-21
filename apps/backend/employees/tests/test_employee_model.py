import pytest
from farid_tests.factories.employees import EmployeeFactory


@pytest.mark.django_db
def test_employee_str_contains_employee_number():
    e = EmployeeFactory(employee_number="EMP-00001", first_name="Bob", last_name="Jones")
    assert "EMP-00001" in str(e)