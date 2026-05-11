# farid_tests/integration/test_company_crud.py
import pytest
from django.urls import reverse

from companies.models import Company
from farid_tests.factories.companies import CompanyFactory
from farid_tests.factories.users import UserFactory
from users.models.roles import UserRoles

pytestmark = pytest.mark.django_db


@pytest.fixture(autouse=True)
def authenticate_admin(api_client):
    user = UserFactory.create(is_staff=True, role=UserRoles.ADMIN)
    api_client.force_authenticate(user=user)


def _unwrap_list_response(data):
    return data["results"] if isinstance(data, dict) and "results" in data else data


def test_create_company_success(api_client):
    url = reverse("companies-list")

    payload = {"name": "TransLog"}

    response = api_client.post(url, payload, format="json")

    assert response.status_code == 201
    assert "id" in response.data
    assert response.data["name"] == "TransLog"

    assert Company.objects.filter(name="TransLog").exists()


def test_create_company_missing_name(api_client):
    url = reverse("companies-list")

    response = api_client.post(url, {}, format="json")

    assert response.status_code == 400
    assert "name" in response.data


def test_create_company_duplicate_name_rejected(api_client):
    CompanyFactory.create(name="ACME")

    url = reverse("companies-list")
    response = api_client.post(url, {"name": "ACME"}, format="json")

    assert response.status_code == 400
    assert "name" in response.data


def test_list_companies(api_client):
    CompanyFactory.create(name="A")
    CompanyFactory.create(name="B")

    url = reverse("companies-list")
    response = api_client.get(url)

    assert response.status_code == 200
    items = _unwrap_list_response(response.data)
    assert len(items) >= 2


def test_retrieve_company(api_client):
    company = CompanyFactory.create(name="MegaCorp")

    url = reverse("companies-detail", args=[company.id])
    response = api_client.get(url)

    assert response.status_code == 200
    assert response.data["id"] == company.id
    assert response.data["name"] == "MegaCorp"


def test_update_company_name(api_client):
    company = CompanyFactory.create(name="OldName")

    url = reverse("companies-detail", args=[company.id])
    response = api_client.patch(url, {"name": "NewName"}, format="json")

    assert response.status_code in (200, 202)

    company.refresh_from_db()
    assert company.name == "NewName"


def test_delete_company(api_client):
    company = CompanyFactory.create(name="DeleteMe")

    url = reverse("companies-detail", args=[company.id])
    response = api_client.delete(url)

    # Depending on your ViewSet permissions/config
    assert response.status_code in (204, 200)

    assert not Company.objects.filter(id=company.id).exists()
