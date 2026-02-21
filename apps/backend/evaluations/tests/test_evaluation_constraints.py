import pytest
from django.db import IntegrityError, transaction
from farid_tests.factories.candidates import CandidateFactory
from farid_tests.factories.employees import EmployeeFactory
from farid_tests.factories.positions import PositionFactory
from farid_tests.factories.templates import TemplateVersionFactory
from evaluations.models import Evaluation


@pytest.mark.django_db
def test_evaluation_requires_exactly_one_subject_candidate_or_employee():
    position = PositionFactory()
    template_version = TemplateVersionFactory()

    # both null -> should fail
    with pytest.raises(IntegrityError):
        with transaction.atomic():
            Evaluation.objects.create(
                candidate=None,
                employee=None,
                position=position,
                template_version=template_version,
                status="draft",
            )

    # both set -> should fail
    with pytest.raises(IntegrityError):
        with transaction.atomic():
            Evaluation.objects.create(
                candidate=CandidateFactory(),
                employee=EmployeeFactory(),
                position=position,
                template_version=template_version,
                status="draft",
            )

    # candidate only -> ok
    e1 = Evaluation.objects.create(
        candidate=CandidateFactory(),
        employee=None,
        position=position,
        template_version=template_version,
        status="draft",
    )
    assert e1.id is not None

    # employee only -> ok
    e2 = Evaluation.objects.create(
        candidate=None,
        employee=EmployeeFactory(),
        position=position,
        template_version=template_version,
        status="draft",
    )
    assert e2.id is not None