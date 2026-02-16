import pytest
from django.urls import reverse
from candidates.models import Candidate

@pytest.mark.django_db
def test_filter_candidates(api_client):
    # Arrange — créer plusieurs candidats avec différents statuts et flags
    Candidate.objects.create(
        first_name="Jean",
        last_name="Dupont",
        email="jean@example.com",
        phone="0600000001",
        status="new",
        flag=True,
    )
    Candidate.objects.create(
        first_name="Marie",
        last_name="Durand",
        email="marie@example.com",
        phone="0600000002",
        status="contacted",
        flag=False,
    )
    Candidate.objects.create(
        first_name="Paul",
        last_name="Martin",
        email="paul@example.com",
        phone="0600000003",
        status="new",
        flag=False,
    )

    url = reverse("candidates-list")

    # --- Filtre statut ---
    response = api_client.get(url, {"status": "new"})
    assert response.status_code == 200
    assert len(response.data) == 2
    assert all(c["status"] == "new" for c in response.data)

    # --- Filtre flag ---
    response = api_client.get(url, {"flag": "true"})
    assert response.status_code == 200
    assert len(response.data) == 1
    assert response.data[0]["first_name"] == "Jean"
