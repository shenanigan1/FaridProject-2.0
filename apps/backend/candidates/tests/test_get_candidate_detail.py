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
def test_get_candidate_detail(api_client):
    payload = {
        "first_name": "Jean",
        "last_name": "Dupont",
        "email": "jean@example.com",
        "phone": "0600000001",
    }
    if _has_field("status"):
        payload["status"] = "pending"
    if _has_field("target_position_id"):
        payload["target_position_id"] = 3
    if _has_field("flag"):
        payload["flag"] = True

    candidate = Candidate.objects.create(**payload)

    url = reverse("candidates-detail", args=[candidate.id])
    response = api_client.get(url)

    assert response.status_code == 200
    assert response.data["id"] == candidate.id
    assert response.data["first_name"] == "Jean"
    assert response.data["last_name"] == "Dupont"
    assert response.data["email"] == "jean@example.com"
    assert response.data["phone"] == "0600000001"

    if _has_field("status"):
        assert response.data["status"] == "pending"
    if _has_field("target_position_id"):
        assert response.data["target_position_id"] == 3
    if _has_field("flag"):
        assert response.data["flag"] is True
