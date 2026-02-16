import pytest
from django.urls import reverse
from candidates.models import Candidate

@pytest.mark.django_db
def test_list_candidates(api_client):
    # Arrange — créer plusieurs candidats
    Candidate.objects.create(
        first_name="Jean",
        last_name="Dupont",
        email="jean@example.com",
        phone="0600000001",
    )
    Candidate.objects.create(
        first_name="Marie",
        last_name="Durand",
        email="marie@example.com",
        phone="0600000002",
    )

    # Act — appeler l’endpoint
    url = reverse("candidates-list")  # DRF router basename='candidates'
    response = api_client.get(url)

    # Assert — statut OK
    assert response.status_code == 200

    # Assert — format liste
    assert isinstance(response.data, list)

    # Assert — 2 candidats retournés
    assert len(response.data) == 2

    # Vérification basique du contenu
    assert response.data[0]["first_name"] in ["Jean", "Marie"]
    assert response.data[1]["first_name"] in ["Jean", "Marie"]
