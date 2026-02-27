# farid_tests/integration/test_position_crud.py
import pytest
from django.urls import reverse

from users.models.roles import UserRoles
from farid_tests.factories.users import UserFactory
from positions.models import Position
from farid_tests.factories.companies import CompanyFactory
from farid_tests.factories.positions import PositionFactory

pytestmark = pytest.mark.django_db


def _unwrap_list_response(data):
    return data["results"] if isinstance(data, dict) and "results" in data else data


def test_create_position_success(api_client):
    company = CompanyFactory.create(name="TransLog")
    url = reverse("positions-list")
    user = UserFactory.create(is_staff=True, role=UserRoles.ADMIN)
    api_client.force_authenticate(user=user)

    payload = {
        "company": company.id,
        "title": "Driver",
        "description": "Deliver goods",
        "department": "Logistics",
        "contract_type": "CDI",
        "location": "Paris",
        "salary": 2200,
        "is_active": True,
    }

    response = api_client.post(url, payload, format="json")

    assert response.status_code == 201, response.data
    assert "id" in response.data
    assert response.data["title"] == "Driver"

    pos = Position.objects.get(id=response.data["id"])
    assert pos.company_id == company.id
    assert pos.salary == 2200


def test_create_position_missing_required_fields(api_client):
    url = reverse("positions-list")
    user = UserFactory.create(is_staff=True, role=UserRoles.ADMIN)
    api_client.force_authenticate(user=user)
    response = api_client.post(url, {}, format="json")
    user = UserFactory.create(is_staff=True, role=UserRoles.ADMIN)
    api_client.force_authenticate(user=user)

    assert response.status_code == 400
    # Required fields depends on serializer; minimally:
    assert "company" in response.data
    assert "title" in response.data
    assert "department" in response.data
    assert "contract_type" in response.data


def test_list_positions(api_client):
    user = UserFactory.create(is_staff=True, role=UserRoles.ADMIN)
    api_client.force_authenticate(user=user)
    PositionFactory.create(title="A")
    PositionFactory.create(title="B")

    url = reverse("positions-list")
    response = api_client.get(url)

    assert response.status_code == 200
    items = _unwrap_list_response(response.data)
    assert len(items) >= 2


def test_retrieve_position(api_client):
    user = UserFactory.create(is_staff=True, role=UserRoles.ADMIN)
    api_client.force_authenticate(user=user)
    pos = PositionFactory.create(title="Forklift Driver")

    url = reverse("positions-detail", args=[pos.id])
    response = api_client.get(url)

    assert response.status_code == 200
    assert response.data["id"] == pos.id
    assert response.data["title"] == "Forklift Driver"


def test_update_position(api_client):
    user = UserFactory.create(is_staff=True, role=UserRoles.ADMIN)
    api_client.force_authenticate(user=user)
    pos = PositionFactory.create(title="Old Title")

    url = reverse("positions-detail", args=[pos.id])
    response = api_client.patch(
        url, {"title": "New Title", "is_active": False}, format="json"
    )

    assert response.status_code in (200, 202)

    pos.refresh_from_db()
    assert pos.title == "New Title"
    assert pos.is_active is False


def test_delete_position(api_client):
    user = UserFactory.create(is_staff=True, role=UserRoles.ADMIN)
    api_client.force_authenticate(user=user)
    pos = PositionFactory.create(title="DeleteMe")

    url = reverse("positions-detail", args=[pos.id])
    response = api_client.delete(url)

    # Depending on your business rules, you might disallow deletes.
    assert response.status_code in (204, 200, 405, 403)

    if response.status_code in (204, 200):
        assert not Position.objects.filter(id=pos.id).exists()
