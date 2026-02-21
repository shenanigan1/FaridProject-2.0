import pytest

from positions.models import Position
from positions.services import associate_template_to_position
from templates_grid.models import Template


@pytest.mark.django_db
def test_associate_template_service_returns_400_when_template_id_missing():
    position = Position.objects.create(
        title="Backend Developer",
        description="API development",
        department="Engineering",
        contract_type="Full-time",
        company_id=1,
        location="Bordeaux",
        salary=45000,
    )

    result = associate_template_to_position(position=position, template_id=None)

    assert result.ok is False
    assert result.status_code == 400
    assert result.payload == {"template_id": ["This field is required."]}


@pytest.mark.django_db
def test_associate_template_service_returns_404_when_template_not_found():
    position = Position.objects.create(
        title="Backend Developer",
        description="API development",
        department="Engineering",
        contract_type="Full-time",
        company_id=1,
        location="Bordeaux",
        salary=45000,
    )

    result = associate_template_to_position(position=position, template_id=9999)

    assert result.ok is False
    assert result.status_code == 404
    assert result.payload == {"template_id": ["Template not found."]}


@pytest.mark.django_db
def test_associate_template_service_successfully_links_template():
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
        nom="Backend Evaluation Template",
        type="Evaluation",
        poste_id=position.id,
    )

    result = associate_template_to_position(position=position, template_id=template.id)

    assert result.ok is True
    assert result.status_code == 200
    assert result.payload == {"status": "template associated"}
    assert template in position.templates.all()
