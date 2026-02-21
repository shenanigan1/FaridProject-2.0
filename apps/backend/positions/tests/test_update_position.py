import pytest
from django.urls import reverse

from positions.models import Position


@pytest.mark.django_db
def test_update_position(api_client):
    position = Position.objects.create(
        title="Backend Developer",
        description="API development",
        department="Engineering",
        contract_type="Full-time",
        company_id=1,
        location="Bordeaux",
        salary=45000,
    )

    payload = {
        "title": "Backend Engineer",
        "description": "API and distributed systems",
        "department": "Platform",
        "contract_type": "Permanent",
        "company_id": 2,
        "location": "Paris",
        "salary": 55000,
    }

    url = reverse("positions-detail", args=[position.id])
    response = api_client.put(url, payload, format="json")

    assert response.status_code == 200

    position.refresh_from_db()

    assert position.title == "Backend Engineer"
    assert position.description == "API and distributed systems"
    assert position.department == "Platform"
    assert position.contract_type == "Permanent"
    assert position.company_id == 2
    assert position.location == "Paris"
    assert position.salary == 55000
