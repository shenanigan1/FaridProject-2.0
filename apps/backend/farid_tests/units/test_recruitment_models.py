# farid_tests/unit/test_recruitment_models.py
import pytest
from django.db import IntegrityError

from farid_tests.factories.candidates import CandidateFactory
from farid_tests.factories.positions import PositionFactory
from recruitment.models.job_application import JobApplication, ApplicationStatus

pytestmark = pytest.mark.django_db


def test_job_application_defaults_to_applied():
    candidate = CandidateFactory.create()
    position = PositionFactory.create()

    app = JobApplication.objects.create(candidate=candidate, position=position)

    assert app.status == ApplicationStatus.APPLIED


def test_job_application_unique_candidate_position():
    candidate = CandidateFactory.create()
    position = PositionFactory.create()

    JobApplication.objects.create(candidate=candidate, position=position)

    with pytest.raises(IntegrityError):
        JobApplication.objects.create(candidate=candidate, position=position)


def test_job_application_str_contains_candidate_and_position():
    candidate = CandidateFactory.create(
        first_name="Jean", last_name="Dupont", email="jd@app.com"
    )
    position = PositionFactory.create(title="Driver")

    app = JobApplication.objects.create(candidate=candidate, position=position)

    s = str(app)
    assert "Driver" in s
