import pytest
from django.urls import reverse

@pytest.mark.django_db
def test_create_template_missing_fields(api_client):
    url = reverse("templates-list")

    # Missing 'nom'
    payload_missing_nom = {
        "type": "technique",
        "poste_id": 1,
    }

    response = api_client.post(url, payload_missing_nom, format="json")
    assert response.status_code == 400
    assert "nom" in response.data

    # Missing 'type'
    payload_missing_type = {
        "nom": "Grille Backend Junior",
        "poste_id": 1,
    }

    response = api_client.post(url, payload_missing_type, format="json")
    assert response.status_code == 400
    assert "type" in response.data

    # Missing 'poste_id'
    payload_missing_poste = {
        "nom": "Grille Backend Junior",
        "type": "technique",
    }

    response = api_client.post(url, payload_missing_poste, format="json")
    assert response.status_code == 400
    assert "poste_id" in response.data
