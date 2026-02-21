import pytest
from django.urls import reverse

from candidates.models import Candidate


@pytest.mark.django_db
def test_list_candidates(api_client):
    Candidate.objects.create(
        first_name="Jean",
        last_name="Dupont",
        email="jean@example.com",
        phone="0600000001",
        status="pending",
        flag=False,
        target_position_id=None,
    )
    Candidate.objects.create(
        first_name="Marie",
        last_name="Durand",
        email="marie@example.com",
        phone="0600000002",
        status="contacted",
        flag=True,
        target_position_id=5,
    )

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
        assert "status" in item
        assert "flag" in item
        assert "target_position_id" in item
