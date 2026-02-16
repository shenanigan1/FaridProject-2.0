import pytest
from django.urls import reverse

@pytest.mark.django_db
def test_create_candidate_success(api_client):
    url = reverse("candidates-list")  # DRF router: basename 'candidats'

    payload = {
        "first_name": "Jean",
        "last_name": "Dupont",
        "email": "jean.dupont@example.com",
        "phone": "0601020304",
    }

    response = api_client.post(url, payload, format="json")

    # Statut attendu
    assert response.status_code == 201

    # Vérifie que l'ID est présent dans la réponse
    assert "id" in response.data
    assert isinstance(response.data["id"], int)
    

@pytest.mark.django_db
def test_create_candidate_missing_fields(api_client):
    url = reverse("candidates-list")

    # Payload vide → doit échouer
    payload = {}

    response = api_client.post(url, payload, format="json")

    # Statut attendu
    assert response.status_code == 400

    # Vérifie que les champs obligatoires sont signalés
    assert "first_name" in response.data
    assert "last_name" in response.data
    assert "email" in response.data

    # Messages d'erreur clairs
    assert response.data["first_name"][0] == "This field is required."
    assert response.data["last_name"][0] == "This field is required."
    assert response.data["email"][0] == "This field is required."
