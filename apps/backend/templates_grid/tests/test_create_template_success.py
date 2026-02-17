import pytest
from django.urls import reverse
from templates_grid.models import Template

@pytest.mark.django_db
def test_create_template_success(api_client):
    # Valid payload for creating an evaluation template
    payload = {
        "nom": "Grille Backend Junior",
        "type": "technique",
        "poste_id": 1,  # FK vers Position
    }

    url = reverse("templates-list")
    response = api_client.post(url, payload, format="json")

    # Must return HTTP 201 Created
    assert response.status_code == 201

    # Response must contain the ID of the created template
    assert "id" in response.data

    # Ensure the template exists in the database
    template = Template.objects.get(id=response.data["id"])
    assert template.nom == "Grille Backend Junior"
    assert template.type == "technique"
    assert template.poste_id == 1
