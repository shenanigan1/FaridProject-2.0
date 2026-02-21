import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from users.models import User, UserRoles
from candidates.models import Candidate


def _auth_client() -> APIClient:
    """
    Enterprise clean: most endpoints are protected.
    This helper authenticates an APIClient with a valid JWT.
    """
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
def test_create_candidate_success():
    client = _auth_client()

    # ⚠️ Router basename must match your urls.py.
    # If your router is router.register("candidates", ..., basename="candidates") then this is correct.
    url = reverse("candidates-list")

    payload = {
        "first_name": "Jean",
        "last_name": "Dupont",
        "email": "jean.dupont@example.com",
        "phone": "0601020304",
    }

    response = client.post(url, payload, format="json")

    assert response.status_code == 201
    assert "id" in response.data
    assert isinstance(response.data["id"], int)

    # Enterprise clean: assert persistence + defaults (don’t rely only on response)
    candidate = Candidate.objects.get(id=response.data["id"])
    assert candidate.first_name == "Jean"
    assert candidate.last_name == "Dupont"
    assert candidate.email == "jean.dupont@example.com"
    assert candidate.phone == "0601020304"

    # Optional defaults (keep only if your model defines them)
    if hasattr(candidate, "status"):
        assert candidate.status == "pending"
    if hasattr(candidate, "flag"):
        assert candidate.flag is False


@pytest.mark.django_db
def test_create_candidate_missing_fields():
    client = _auth_client()
    url = reverse("candidates-list")

    response = client.post(url, {}, format="json")

    assert response.status_code == 400

    # Required fields should be reported
    assert "first_name" in response.data
    assert "last_name" in response.data
    assert "email" in response.data