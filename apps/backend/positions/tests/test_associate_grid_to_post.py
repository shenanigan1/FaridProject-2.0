import pytest
from django.urls import reverse

from positions.models import Position
from templates_grid.models.template import Template


def _position_payload():
    payload = {
        "title": "Backend Developer",
        "description": "API development",
        "department": "Engineering",
        "location": "Bordeaux",
        "salary": 45000,
        "contract_type": "Full-time",
        "company_id": 1,
    }

    model_fields = {
        field.name
        for field in Position._meta.get_fields()
        if getattr(field, "concrete", False)
    }
    return {k: v for k, v in payload.items() if k in model_fields}


@pytest.mark.django_db
def test_associate_template_to_post(api_client):
    position = Position.objects.create(**_position_payload())

    template = Template.objects.create(
        nom="Backend Evaluation Template",
        type="Evaluation",
        poste_id=position.id,
    )

    url = reverse("positions-associate-template", args=[position.id])
    payload = {"grid_id": template.id}

    response = api_client.post(url, payload, format="json")

    assert response.status_code == 200

    position.refresh_from_db()
    assert template in position.templates.all()
