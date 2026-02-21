import pytest
from django.urls import reverse

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





def _has_field(field_name: str) -> bool:
    try:
        Candidate._meta.get_field(field_name)
        return True
    except Exception:
        return False


@pytest.mark.django_db
def test_list_candidates(api_client):
    first = {
        "first_name": "Jean",
        "last_name": "Dupont",
        "email": "jean@example.com",
        "phone": "0600000001",
    }
    second = {
        "first_name": "Marie",
        "last_name": "Durand",
        "email": "marie@example.com",
        "phone": "0600000002",
    }

    if _has_field("status"):
        first["status"] = "pending"
        second["status"] = "contacted"
    if _has_field("flag"):
        first["flag"] = False
        second["flag"] = True
    if _has_field("target_position_id"):
        first["target_position_id"] = None
        second["target_position_id"] = 5

    Candidate.objects.create(**first)
    Candidate.objects.create(**second)

    url = reverse("candidates-list")
    response = api_client.get(url)

    assert response.status_code == 200
    assert isinstance(response.data, list)
    assert len(response.data) == 2

    for item in response.data:
        assert "first_name" in item
        assert "last_name" in item
        assert "email" in item
        assert "phone" in item
        if _has_field("status"):
            assert "status" in item
        if _has_field("flag"):
            assert "flag" in item
        if _has_field("target_position_id"):
            assert "target_position_id" in item
