import pytest
from django.urls import reverse
from positions.models import Position

@pytest.mark.django_db
def test_list_positions(api_client):
    # Create several positions
    Position.objects.create(
        title="Backend Developer",
        description="API development",
        department="Engineering",
        contract_type="Full-time",
        company_id=1,
        location="Bordeaux",
        salary=45000,
    )

    Position.objects.create(
        title="Frontend Developer",
        description="UI development",
        department="Engineering",
        contract_type="Full-time",
        company_id=1,
        location="Paris",
        salary=42000,
    )

    url = reverse("positions-list")
    response = api_client.get(url)

    # Must return HTTP 200 OK
    assert response.status_code == 200

    # Response must be a list
    assert isinstance(response.data, list)

    # Must contain exactly 2 positions
    assert len(response.data) == 2

    # Check that titles match the created objects
    returned_titles = {item["title"] for item in response.data}
    assert "Backend Developer" in returned_titles
    assert "Frontend Developer" in returned_titles
