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
def test_update_candidate(api_client):
    initial = {
        "first_name": "Jean",
        "last_name": "Dupont",
        "email": "jean@example.com",
        "phone": "0600000001",
    }
    if _has_field("status"):
        initial["status"] = "pending"
    if _has_field("flag"):
        initial["flag"] = False
    if _has_field("target_position_id"):
        initial["target_position_id"] = None

    candidate = Candidate.objects.create(**initial)

    payload = {
        "first_name": "Jean-Michel",
        "last_name": "Dupont",
        "email": "jean.michel@example.com",
        "phone": "0600000002",
    }
    if _has_field("status"):
        payload["status"] = "contacted"
    if _has_field("flag"):
        payload["flag"] = True
    if _has_field("target_position_id"):
        payload["target_position_id"] = 42

    url = reverse("candidates-detail", args=[candidate.id])
    response = api_client.put(url, payload, format="json")

    assert response.status_code == 200

    candidate.refresh_from_db()
    assert candidate.first_name == "Jean-Michel"
    assert candidate.email == "jean.michel@example.com"
    assert candidate.phone == "0600000002"
    if _has_field("status"):
        assert candidate.status == "contacted"
    if _has_field("flag"):
        assert candidate.flag is True
    if _has_field("target_position_id"):
        assert candidate.target_position_id == 42
