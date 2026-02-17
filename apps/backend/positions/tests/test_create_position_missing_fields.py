import pytest
from django.urls import reverse

@pytest.mark.django_db
def test_create_position_missing_fields(api_client):
    # Missing required fields: title, department, contract_type
    payload = {
        # "title": "Backend Developer",        # required
        # "department": "Engineering",         # required
        # "contract_type": "Full-time",        # required
        "location": "Bordeaux",
        "salary": 45000,
    }

    url = reverse("positions-list")
    response = api_client.post(url, payload, format="json")

    # Must return HTTP 400 Bad Request
    assert response.status_code == 400

    # Error messages must clearly indicate missing fields
    assert "title" in response.data
    assert "department" in response.data
    assert "contract_type" in response.data
