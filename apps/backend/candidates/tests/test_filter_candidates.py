import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from candidates.models import Candidate
from users.models import User, UserRoles


def _auth_client() -> APIClient:
    user = User.objects.create_user(
        email="tester@farid.com",
        password="password123",
        role=UserRoles.HR,
    )
    refresh = RefreshToken.for_user(user)
    client = APIClient()
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(refresh.access_token)}")
    return client


def _extract_items(response_data):
    """
    Enterprise clean: support both paginated and non-paginated responses.
    """
    if isinstance(response_data, dict) and "results" in response_data:
        return response_data["results"]
    return response_data


@pytest.mark.django_db
def test_filter_candidates():
    client = _auth_client()

    Candidate.objects.create(
        first_name="Jean",
        last_name="Dupont",
        email="jean@example.com",
        phone="0600000001",
        status="new",
        flag=True,
    )
    Candidate.objects.create(
        first_name="Marie",
        last_name="Durand",
        email="marie@example.com",
        phone="0600000002",
        status="contacted",
        flag=False,
    )
    Candidate.objects.create(
        first_name="Paul",
        last_name="Martin",
        email="paul@example.com",
        phone="0600000003",
        status="new",
        flag=False,
    )

    url = reverse("candidates-list")

    # --- Filter by status ---
    response = client.get(url, {"status": "new"})
    assert response.status_code == 200

    items = _extract_items(response.data)
    assert len(items) == 2
    assert {c["email"] for c in items} == {"jean@example.com", "paul@example.com"}
    assert all(c["status"] == "new" for c in items)

    # --- Filter by flag ---
    # Use "true" but also accept booleans depending on filter implementation.
    response = client.get(url, {"flag": True})
    assert response.status_code == 200

    items = _extract_items(response.data)
    assert len(items) == 1
    assert items[0]["email"] == "jean@example.com"
    assert items[0]["flag"] is True