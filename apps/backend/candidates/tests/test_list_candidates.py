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
    if isinstance(response_data, dict) and "results" in response_data:
        return response_data["results"]
    return response_data


@pytest.mark.django_db
def test_list_candidates():
    client = _auth_client()

    Candidate.objects.create(
        first_name="Jean",
        last_name="Dupont",
        email="jean@example.com",
        phone="0600000001",
    )
    Candidate.objects.create(
        first_name="Marie",
        last_name="Durand",
        email="marie@example.com",
        phone="0600000002",
    )

    url = reverse("candidates-list")
    response = client.get(url)

    assert response.status_code == 200

    items = _extract_items(response.data)
    assert isinstance(items, list)
    assert len(items) == 2

    returned_emails = {c["email"] for c in items}
    assert returned_emails == {"jean@example.com", "marie@example.com"}