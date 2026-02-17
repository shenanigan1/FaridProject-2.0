import pytest
from django.urls import reverse
from templates_grid.models import Template

@pytest.mark.django_db
def test_list_templates(api_client):
    # Create multiple templates
    Template.objects.create(nom="Grille Backend Junior", type="technique", poste_id=1)
    Template.objects.create(nom="Grille Frontend Senior", type="technique", poste_id=2)

    url = reverse("templates-list")
    response = api_client.get(url)

    # Must return HTTP 200 OK
    assert response.status_code == 200

    # Response must be a list
    assert isinstance(response.data, list)
    assert len(response.data) == 2

    # Check first item structure
    assert "id" in response.data[0]
    assert "nom" in response.data[0]
    assert "type" in response.data[0]
    assert "poste_id" in response.data[0]
