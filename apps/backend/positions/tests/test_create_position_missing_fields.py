import pytest
from django.urls import reverse


@pytest.mark.django_db
def test_create_position_missing_fields(api_client):
    payload = {
        "location": "Bordeaux",
        "salary": 45000,
    }

    url = reverse("positions-list")
    response = api_client.post(url, payload, format="json")

    assert response.status_code == 400
    assert "title" in response.data
    assert "department" in response.data
    assert "contract_type" in response.data
    assert "company_id" in response.data
