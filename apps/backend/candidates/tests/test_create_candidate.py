import pytest
from django.urls import reverse

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

    response = api_client.post(url, payload, format="json")

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
def test_create_candidate_missing_fields(api_client):
    url = reverse("candidates-list")

    response = api_client.post(url, {}, format="json")

    assert response.status_code == 400
    assert "first_name" in response.data
    assert "last_name" in response.data
    assert "email" in response.data

    assert response.data["first_name"][0] == "This field is required."
    assert response.data["last_name"][0] == "This field is required."
    assert response.data["email"][0] == "This field is required."
