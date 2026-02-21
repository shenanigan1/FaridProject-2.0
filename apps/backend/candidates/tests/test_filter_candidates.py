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
    """
    Enterprise clean: support both paginated and non-paginated responses.
    """
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
def test_filter_candidates(api_client):
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
    third = {
        "first_name": "Paul",
        "last_name": "Martin",
        "email": "paul@example.com",
        "phone": "0600000003",
    }

    if _has_field("status"):
        first["status"] = "new"
        second["status"] = "contacted"
        third["status"] = "new"

    if _has_field("flag"):
        first["flag"] = True
        second["flag"] = False
        third["flag"] = False

    Candidate.objects.create(**first)
    Candidate.objects.create(**second)
    Candidate.objects.create(**third)

    url = reverse("candidates-list")

    if _has_field("status"):
        response = api_client.get(url, {"status": "new"})
        assert response.status_code == 200
        assert len(response.data) == 2
        assert all(c.get("status") == "new" for c in response.data)

    if _has_field("flag"):
        response = api_client.get(url, {"flag": "true"})
        assert response.status_code == 200
        assert len(response.data) == 1
        assert response.data[0]["first_name"] == "Jean"
