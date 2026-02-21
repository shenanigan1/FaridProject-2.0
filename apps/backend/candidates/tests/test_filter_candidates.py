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
