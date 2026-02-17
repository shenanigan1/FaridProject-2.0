import pytest
from django.urls import reverse
from templates_grid.models import Template

@pytest.mark.django_db
def test_update_template(api_client):
    # Create initial template
    template = Template.objects.create(
        nom="Grille Backend Junior",
        type="technique",
        poste_id=1,
    )

    # New data to update
    payload = {
        "nom": "Grille Backend Senior",
        "type": "technique",
        "poste_id": 2,
    }

    url = reverse("templates-detail", args=[template.id])
    response = api_client.put(url, payload, format="json")

    # Must return HTTP 200 OK
    assert response.status_code == 200

    # Refresh from DB
    template.refresh_from_db()

    # Check updated values
    assert template.nom == "Grille Backend Senior"
    assert template.type == "technique"
    assert template.poste_id == 2
