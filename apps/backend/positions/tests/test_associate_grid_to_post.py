import pytest
from django.urls import reverse
from positions.models import Position
from templates_grid.models.template import Template  # supposé module futur

@pytest.mark.django_db
def test_associate_template_to_post(api_client):
    position = Position.objects.create(
        title="Backend Developer",
        description="API development",
        department="Engineering",
        contract_type="Full-time",
        company_id=1,
        location="Bordeaux",
        salary=45000,
    )

    template = Template.objects.create(
        name="Backend Evaluation Template"
    )

    url = reverse("positions-associate-template", args=[position.id])
    payload = {"grid_id": template.id}

    response = api_client.post(url, payload, format="json")

    assert response.status_code == 200

    position.refresh_from_db()

    assert template in position.templates.all()

