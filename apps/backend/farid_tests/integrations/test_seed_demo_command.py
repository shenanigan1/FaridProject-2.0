import pytest
from django.core.management import call_command

from candidates.models import Candidate
from evaluations.models import Evaluation, EvaluationResponse
from recruitment.models import JobApplication
from templates_grid.models import QuestionPool, SkillQuestion, Template, TemplateSection
from users.models import User, UserRoles

pytestmark = pytest.mark.django_db


def test_seed_demo_creates_complete_idempotent_demo_dataset():
    call_command("seed_demo")
    call_command("seed_demo")

    assert (
        User.objects.filter(email="admin@fleetflow.demo", role=UserRoles.ADMIN).count()
        == 1
    )
    assert (
        User.objects.filter(email="rh@fleetflow.demo", role=UserRoles.HR).count() == 1
    )
    assert (
        User.objects.filter(
            email="manager@fleetflow.demo", role=UserRoles.MANAGER
        ).count()
        == 1
    )
    assert (
        User.objects.filter(
            email="candidate@fleetflow.demo", role=UserRoles.CANDIDATE
        ).count()
        == 1
    )

    candidate_user = User.objects.get(email="candidate@fleetflow.demo")
    assert Candidate.objects.filter(user=candidate_user).count() == 1

    template = Template.objects.get(name="Demo - Evaluation Chauffeur CDL-A")
    assert TemplateSection.objects.filter(template=template).count() == 3
    assert QuestionPool.objects.filter(code__startswith="DEMO_").count() == 3
    assert SkillQuestion.objects.filter(pool__code__startswith="DEMO_").count() >= 5

    application = JobApplication.objects.get(candidate__user=candidate_user)
    evaluations = Evaluation.objects.filter(application=application).order_by("id")
    assert evaluations.count() == 2
    assert {evaluation.status for evaluation in evaluations} == {
        "in_progress",
        "completed",
    }
    assert evaluations.filter(section_assignments__isnull=False).exists()
    assert EvaluationResponse.objects.filter(evaluation__in=evaluations).exists()
