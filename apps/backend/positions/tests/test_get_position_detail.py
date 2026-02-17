import pytest
from django.urls import reverse
from positions.models import Position

@pytest.mark.django_db
def test_get_position_detail(api_client):
    # Create a position
    position = Position.objects.create(
        title="Backend Developer",
        description="API development",
        department="Engineering",
        contract_type="Full-time",
        company_id=1,
        location="Bordeaux",
        salary=45000,
    )

    url = reverse("positions-detail", args=[position.id])
    response = api_client.get(url)

    # Must return HTTP 200 OK
    assert response.status_code == 200

    # Response must contain correct fields
    assert response.data["id"] == position.id
    assert response.data["title"] == "Backend Developer"
    assert response.data["department"] == "Engineering"
    assert response.data["contract_type"] == "Full-time"
    assert response.data["company_id"] == 1
