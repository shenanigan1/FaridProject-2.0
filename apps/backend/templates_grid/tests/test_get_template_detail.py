import pytest
from django.urls import reverse
from templates_grid.models import Template

@pytest.mark.django_db
def test_get_template_detail(api_client):
    # Create a template
    template = Template.objects.create(
        name="Grille Backend Junior"
    )

    url = reverse("templates-detail", args=[template.id])
    response = api_client.get(url)

    # Must return HTTP 200 OK
    assert response.status_code == 200

    # Check returned data
    assert response.data["id"] == template.id
    assert response.data["name"] == "Grille Backend Junior"
