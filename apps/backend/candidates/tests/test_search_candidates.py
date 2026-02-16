import pytest
from django.urls import reverse
from candidates.models import Candidate

@pytest.mark.django_db
def test_search_candidates(api_client):
    # Arrange — créer plusieurs candidats
    Candidate.objects.create(
        first_name="Jean",
        last_name="Dupont",
        email="jean.dupont@example.com",
        phone="0600000001",
    )
    Candidate.objects.create(
        first_name="Marie",
        last_name="Durand",
        email="marie.durand@example.com",
        phone="0600000002",
    )
    Candidate.objects.create(
        first_name="Paul",
        last_name="Martin",
        email="paul.martin@example.com",
        phone="0600000003",
    )

    url = reverse("candidates-list")

    # --- Vérifier recherche par nom ---
    response = api_client.get(url, {"search": "Jean"})
    assert response.status_code == 200
    assert len(response.data) == 1
    assert response.data[0]["first_name"] == "Jean"

    # --- Vérifier recherche par email ---
    response = api_client.get(url, {"search": "marie.durand"})
    assert response.status_code == 200
    assert len(response.data) == 1
    assert response.data[0]["email"] == "marie.durand@example.com"

    # --- Vérifier recherche par identifiant ---
    paul = Candidate.objects.get(first_name="Paul")
    response = api_client.get(url, {"search": str(paul.id)})
    assert response.status_code == 200
    assert len(response.data) == 1
    assert response.data[0]["id"] == paul.id
