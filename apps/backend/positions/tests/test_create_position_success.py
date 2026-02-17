import pytest
from django.urls import reverse
from positions.models import Position

@pytest.mark.django_db
def test_create_position_success(api_client):
    # Valid payload for creating a position
    payload = {
        "title": "Backend Developer",
        "description": "Role focused on API development and microservices",
        "department": "Engineering",        
        "location": "Bordeaux",
        "salary": 45000,
        "contract_type": "Full-time",
        "company_id": 1,
    }

    url = reverse("positions-list")
    response = api_client.post(url, payload, format="json")

    # Should return HTTP 201 Created
    assert response.status_code == 201

    # Response must contain the ID of the created position
    assert "id" in response.data

    # Ensure the position exists in the database
    position = Position.objects.get(id=response.data["id"])
    assert position.title == "Backend Developer"
