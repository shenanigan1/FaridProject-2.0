import pytest

from positions.models import Position
from positions.services import associate_template_to_position
from templates_grid.models import Template

# Import the real policy/association model (adjust path if needed)
from positions.models import PositionTemplatePolicy


@pytest.mark.django_db
def test_associate_template_service_returns_400_when_template_id_missing():
    position = Position.objects.create(
        title="Backend Developer",
        description="API development",
        department="Engineering",
        contract_type="Full-time",
        external_company_id=1,
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
        external_company_id=1,
        location="Bordeaux",
        salary=45000,
    )

    result = associate_template_to_position(position=position, template_id=9999)

    assert result.ok is False
    assert result.status_code == 404
    assert result.payload == {"template_id": ["Template not found."]}


@pytest.mark.django_db
def test_associate_template_service_successfully_links_template_by_policy():
    position = Position.objects.create(
        title="Backend Developer",
        description="API development",
        department="Engineering",
        contract_type="Full-time",
        external_company_id=1,
        location="Bordeaux",
        salary=45000,
    )

    template = Template.objects.create(name="Backend Evaluation Template")

    result = associate_template_to_position(position=position, template_id=template.id)

    assert result.ok is True
    assert result.status_code == 200
    assert result.payload == {"status": "template associated"}

    # Enterprise-clean: association is stored in a policy model, not on Position
    qs = PositionTemplatePolicy.objects.filter(position=position)

    assert qs.exists() is True, "A policy record should exist for this position"

    # If your policy uses a boolean flag for active rows, prefer it.
    if "is_active" in [f.name for f in PositionTemplatePolicy._meta.get_fields()]:
        qs = qs.filter(is_active=True)

    current_policy = qs.order_by("-id").first()
    assert current_policy is not None

    # Verify it points to the template we associated
    assert getattr(current_policy, "template_id", None) == template.id