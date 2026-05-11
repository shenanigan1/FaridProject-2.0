# farid_tests/integration/test_employee_crud.py
import pytest
from django.urls import reverse

from employees.models import Employee
from users.models import User
from farid_tests.factories.employees import EmployeeFactory
from farid_tests.factories.users import UserFactory
from users.models.roles import UserRoles

pytestmark = pytest.mark.django_db

BASENAME = "employees"


@pytest.fixture(autouse=True)
def authenticate_admin(api_client):
    user = UserFactory.create(is_staff=True, role=UserRoles.ADMIN)
    api_client.force_authenticate(user=user)


def _unwrap_list_response(data):
    return data["results"] if isinstance(data, dict) and "results" in data else data


def test_create_employee_success(api_client):
    url = reverse(f"{BASENAME}-list")

    payload = {
        "user": {
            "first_name": "Alice",
            "last_name": "Martin",
            "email": "alice.martin@example.com",
            "phone": "0610101010",
        },
        "employee_number": "EMP-9001",
        "department": "Logistics",
    }

    res = api_client.post(url, payload, format="json")

    assert res.status_code == 201
    assert "id" in res.data

    emp = Employee.objects.select_related("user").get(id=res.data["id"])
    assert emp.employee_number == "EMP-9001"
    assert emp.department == "Logistics"
    assert emp.user.email == "alice.martin@example.com"
    assert User.objects.filter(email="alice.martin@example.com").exists()


def test_create_employee_missing_user(api_client):
    url = reverse(f"{BASENAME}-list")

    res = api_client.post(url, {"employee_number": "EMP-1"}, format="json")

    assert res.status_code == 400
    assert "user" in res.data


def test_create_employee_duplicate_employee_number_rejected(api_client):
    EmployeeFactory.create(email="e1@example.com", employee_number="EMP-77")

    url = reverse(f"{BASENAME}-list")
    payload = {
        "user": {
            "first_name": "Bob",
            "last_name": "Durand",
            "email": "bob.durand@example.com",
        },
        "employee_number": "EMP-77",
        "department": "",
    }

    res = api_client.post(url, payload, format="json")

    assert res.status_code == 400
    assert "employee_number" in res.data


def test_list_employees(api_client):
    EmployeeFactory.create(email="l1@example.com", employee_number="EMP-L1")
    EmployeeFactory.create(email="l2@example.com", employee_number="EMP-L2")

    url = reverse(f"{BASENAME}-list")
    res = api_client.get(url)

    assert res.status_code == 200
    items = _unwrap_list_response(res.data)
    assert len(items) >= 2


def test_retrieve_employee(api_client):
    emp = EmployeeFactory.create(email="r1@example.com", employee_number="EMP-R1")

    url = reverse(f"{BASENAME}-detail", args=[emp.id])
    res = api_client.get(url)

    assert res.status_code == 200
    assert res.data["id"] == emp.id


def test_update_employee_department(api_client):
    emp = EmployeeFactory.create(
        email="u1@example.com", employee_number="EMP-U1", department="Old"
    )

    url = reverse(f"{BASENAME}-detail", args=[emp.id])
    res = api_client.patch(url, {"department": "New"}, format="json")

    assert res.status_code in (200, 202)

    emp.refresh_from_db()
    assert emp.department == "New"
