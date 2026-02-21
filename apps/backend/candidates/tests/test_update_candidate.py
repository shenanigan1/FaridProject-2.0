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


@pytest.mark.django_db
def test_update_candidate():
    client = _auth_client()

    candidate = Candidate.objects.create(
        first_name="Jean",
        last_name="Dupont",
        email="jean@example.com",
        phone="0600000001",
    )

    payload = {
        "first_name": "Jean-Michel",
        "last_name": "Dupont",
        "email": "jean.michel@example.com",
        "phone": "0600000002",
    }

    url = reverse("candidates-detail", args=[candidate.id])
    response = client.put(url, payload, format="json")

    assert response.status_code == 200

    candidate.refresh_from_db()

    assert candidate.first_name == "Jean-Michel"
    assert candidate.last_name == "Dupont"
    assert candidate.email == "jean.michel@example.com"
    assert candidate.phone == "0600000002"

    # Optional: validate API response mirrors persisted state
    assert response.data["id"] == candidate.id
    assert response.data["first_name"] == "Jean-Michel"
    assert response.data["email"] == "jean.michel@example.com"