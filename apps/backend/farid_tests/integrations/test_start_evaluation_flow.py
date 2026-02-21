import pytest
from evaluations.models import Evaluation
from farid_tests.factories.positions import PositionFactory
from farid_tests.factories.candidates import CandidateFactory
from farid_tests.factories.templates import TemplateFactory, TemplateVersionFactory
from positions.models import PositionTemplatePolicy


@pytest.mark.django_db
def test_start_evaluation_resolves_template_policy_and_picks_latest_published_version():
    """
    Future behavior:
    - You assign a Template to a Position via PositionTemplatePolicy
    - When starting an evaluation, you pick latest TemplateVersion for that Template
    """
    position = PositionFactory()
    candidate = CandidateFactory()

    template = TemplateFactory(status="published")
    v1 = TemplateVersionFactory(template=template, version=1)
    v2 = TemplateVersionFactory(template=template, version=2)  # latest

    PositionTemplatePolicy.objects.create(
        position=position,
        template=template,
        stage="full",
        scope="candidate",
        effective_from="2026-01-01",
        is_active=True,
    )

    # Later: replace with StartEvaluation service.
    evaluation = Evaluation.objects.create(
        candidate=candidate,
        employee=None,
        position=position,
        template_version=v2,
        status="draft",
    )

    assert evaluation.template_version_id == v2.id