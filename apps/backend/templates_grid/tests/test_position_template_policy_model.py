import pytest
from django.db import IntegrityError
from freezegun import freeze_time

from positions.models import Position
from templates_grid.models import Template
from users.models import User
from positions.models import PositionTemplatePolicy  # adjust import to your file

from farid_tests.factories.positions import PositionFactory
from farid_tests.factories.templates import TemplateFactory
from farid_tests.factories.users import UserFactory


@pytest.mark.django_db
def test_can_create_position_template_policy():
    position = PositionFactory()
    template = TemplateFactory(status="published")
    actor = UserFactory()

    policy = PositionTemplatePolicy.objects.create(
        position=position,
        template=template,
        stage="full",
        scope="both",
        effective_from="2026-01-01",
        is_active=True,
        set_by=actor,
    )
    assert policy.position_id == position.id
    assert policy.template_id == template.id


@pytest.mark.django_db
def test_unique_active_policy_per_position_stage_scope():
    position = PositionFactory()
    template1 = TemplateFactory(status="published")
    template2 = TemplateFactory(status="published")

    PositionTemplatePolicy.objects.create(
        position=position,
        template=template1,
        stage="full",
        scope="both",
        effective_from="2026-01-01",
        is_active=True,
    )

    with pytest.raises(IntegrityError):
        PositionTemplatePolicy.objects.create(
            position=position,
            template=template2,
            stage="full",
            scope="both",
            effective_from="2026-02-01",
            is_active=True,
        )