import pytest
from django.urls import reverse
from positions.models import Position
from grids.models import Grid  # supposé module futur

@pytest.mark.django_db
def test_associate_grid_to_post(api_client):
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

    # Create a grid
    grid = Grid.objects.create(
        name="Backend Evaluation Grid"
    )

    url = reverse("positions-associate-grid", args=[position.id])
    payload = {"grid_id": grid.id}

    response = api_client.post(url, payload, format="json")

    # Must return HTTP 200 OK
    assert response.status_code == 200

    # Refresh from DB
    position.refresh_from_db()

    # Check association
    assert position.grid_id == grid.id
