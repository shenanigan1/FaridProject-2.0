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


from candidates.models import Candidate


from candidates.models import Candidate


from candidates.models import Candidate


def _has_field(field_name: str) -> bool:
    try:
        Candidate._meta.get_field(field_name)
        return True
    except Exception:
        return False


@pytest.mark.django_db
def test_create_candidate_success(api_client):
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

    candidate = Candidate.objects.get(id=response.data["id"])
    assert candidate.first_name == payload["first_name"]
    assert candidate.last_name == payload["last_name"]
    assert candidate.email == payload["email"]
    assert candidate.phone == payload["phone"]

    if _has_field("status"):
        assert candidate.status == "pending"
    if _has_field("flag"):
        assert candidate.flag is False
    if _has_field("target_position_id"):
        assert candidate.target_position_id is None


@pytest.mark.django_db
def test_create_candidate_missing_fields():
    client = _auth_client()
    url = reverse("candidates-list")

    response = api_client.post(url, {}, format="json")

    assert response.status_code == 400
    assert "first_name" in response.data
    assert "last_name" in response.data
    assert "email" in response.data

    assert response.data["first_name"][0] == "This field is required."
    assert response.data["last_name"][0] == "This field is required."
    assert response.data["email"][0] == "This field is required."
