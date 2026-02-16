import pytest
from django.urls import reverse
from candidates.models import Candidate

@pytest.mark.django_db
def test_get_candidate_detail(api_client):
    # Arrange — créer un candidat
    candidate = Candidate.objects.create(
        first_name="Jean",
        last_name="Dupont",
        email="jean@example.com",
        phone="0600000001",
    )

    # Act — appeler l’endpoint détail
    url = reverse("candidates-detail", args=[candidate.id])
    response = api_client.get(url)

    # Assert — statut OK
    assert response.status_code == 200

    # Assert — données correctes
    assert response.data["id"] == candidate.id
    assert response.data["first_name"] == "Jean"
    assert response.data["last_name"] == "Dupont"
    assert response.data["email"] == "jean@example.com"
    assert response.data["phone"] == "0600000001"
