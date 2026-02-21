import pytest
from django.urls import reverse

@pytest.mark.django_db
def test_create_template_missing_fields(api_client):
    url = reverse("templates-list")

    # Missing 'name'
    payload_missing_name = {
    }

    response = api_client.post(url, payload_missing_name, format="json")
    assert response.status_code == 400
    assert "name" in response.data

