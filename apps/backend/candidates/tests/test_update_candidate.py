import pytest
from django.urls import reverse
from candidates.models import Candidate

@pytest.mark.django_db
def test_update_candidate(api_client):
    # Arrange — créer un candidat initial
    candidate = Candidate.objects.create(
        first_name="Jean",
        last_name="Dupont",
        email="jean@example.com",
        phone="0600000001",
    )

    # Nouveau payload à mettre à jour
    payload = {
        "first_name": "Jean-Michel",
        "last_name": "Dupont",
        "email": "jean.michel@example.com",
        "phone": "0600000002",
    }

    # Act — appel PUT sur l’endpoint détail
    url = reverse("candidates-detail", args=[candidate.id])
    response = api_client.put(url, payload, format="json")

    # Assert — statut OK
    assert response.status_code == 200

    # Recharger depuis la base
    candidate.refresh_from_db()

    # Assert — données mises à jour
    assert candidate.first_name == "Jean-Michel"
    assert candidate.email == "jean.michel@example.com"
    assert candidate.phone == "0600000002"
