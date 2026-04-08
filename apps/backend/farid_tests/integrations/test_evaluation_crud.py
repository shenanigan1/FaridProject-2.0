# farid_tests/integration/test_evaluation_crud.py
import pytest
from django.urls import reverse

from evaluations.models import (
    Evaluation,
    EvaluationQuestion,
    EvaluationSectionAssignment,
    SkillAnswer,
)
from farid_tests.factories.users import UserFactory
from farid_tests.factories.positions import PositionFactory
from farid_tests.factories.recruitment import JobApplicationFactory
from farid_tests.factories.templates_grid import (
    TemplateFactory,
    TemplateVersionFactory,
    VersionedPoolFactory,
    VersionedQuestionFactory,
    VersionedSectionFactory,
)
from users.models import UserRoles

pytestmark = pytest.mark.django_db

BASENAME = "evaluations"


def _unwrap_list_response(data):
    return data["results"] if isinstance(data, dict) and "results" in data else data


@pytest.fixture
def hr_api_client(api_client):
    hr_user = UserFactory.create(
        email="hr-evaluations@example.com",
        password="Secret123",
        role=UserRoles.HR,
    )
    api_client.force_authenticate(user=hr_user)
    return api_client


def test_create_evaluation_success(hr_api_client):
    subject = UserFactory.create(email="cand@example.com", password=None)
    template = TemplateFactory.create(name="Driver Template")
    template_version = TemplateVersionFactory.create(template=template, version=1)
    position = PositionFactory.create(title="Truck Driver")

    payload = {
        "subject": subject.id,
        "template_version": template_version.id,
        "position": position.id,
        "status": "in_progress",
        "subject_comment": "",
        "internal_comment": "",
    }

    url = reverse(f"{BASENAME}-list")
    res = hr_api_client.post(url, payload, format="json")

    assert res.status_code == 201
    assert "id" in res.data

    ev = Evaluation.objects.get(id=res.data["id"])
    assert ev.subject_id == subject.id
    assert ev.template_version_id == template_version.id
    assert ev.position_id == position.id
    assert ev.status == "in_progress"


def test_create_evaluation_missing_fields(hr_api_client):
    url = reverse(f"{BASENAME}-list")
    res = hr_api_client.post(url, {}, format="json")

    assert res.status_code == 400
    # minimally required:
    assert "subject" in res.data
    assert "template_version" in res.data


def test_list_evaluations(hr_api_client):
    # Create 2 evals via ORM (independent of API create)
    subject = UserFactory.create(email="s1@example.com", password=None)
    template_version = TemplateVersionFactory.create(
        template=TemplateFactory.create(), version=1
    )

    Evaluation.objects.create(
        subject=subject, template_version=template_version, status="in_progress"
    )
    Evaluation.objects.create(
        subject=subject, template_version=template_version, status="completed"
    )

    url = reverse(f"{BASENAME}-list")
    res = hr_api_client.get(url)

    assert res.status_code == 200
    items = _unwrap_list_response(res.data)
    assert len(items) >= 2


def test_retrieve_evaluation(hr_api_client):
    subject = UserFactory.create(email="s2@example.com", password=None)
    template_version = TemplateVersionFactory.create(
        template=TemplateFactory.create(), version=1
    )
    ev = Evaluation.objects.create(
        subject=subject, template_version=template_version, status="in_progress"
    )

    url = reverse(f"{BASENAME}-detail", args=[ev.id])
    res = hr_api_client.get(url)

    assert res.status_code == 200
    assert res.data["id"] == ev.id


def test_update_evaluation_status(hr_api_client):
    subject = UserFactory.create(email="s3@example.com", password=None)
    template_version = TemplateVersionFactory.create(
        template=TemplateFactory.create(), version=1
    )
    ev = Evaluation.objects.create(
        subject=subject, template_version=template_version, status="in_progress"
    )

    url = reverse(f"{BASENAME}-detail", args=[ev.id])
    res = hr_api_client.patch(url, {"status": "completed"}, format="json")

    assert res.status_code in (200, 202)

    ev.refresh_from_db()
    assert ev.status == "completed"


def test_assign_test_creates_evaluation_from_application(hr_api_client):
    template = TemplateFactory.create(name="Driver Template")
    template_version = TemplateVersionFactory.create(template=template, version=1)
    section = VersionedSectionFactory.create(
        template_version=template_version,
        name="Core skills",
    )
    pool = VersionedPoolFactory.create(
        template_version=template_version,
        section=section,
        name="Pool A",
        code="pool-a",
        random_count=1,
    )
    VersionedQuestionFactory.create(
        pool=pool,
        label="Mandatory 1",
        is_mandatory=True,
        order=0,
    )
    VersionedQuestionFactory.create(
        pool=pool,
        label="Optional 1",
        is_mandatory=False,
        order=1,
    )
    VersionedQuestionFactory.create(
        pool=pool,
        label="Optional 2",
        is_mandatory=False,
        order=2,
    )
    manager = UserFactory.create(
        email="manager@example.com",
        password="Secret123",
        role=UserRoles.MANAGER,
    )
    application = JobApplicationFactory.create(assigned_template=template)
    url = reverse(f"{BASENAME}-assign-test")
    res = hr_api_client.post(
        url,
        {"application_id": application.id, "evaluator_id": manager.id},
        format="json",
    )

    assert res.status_code == 201
    assert res.data["application"] == application.id
    assert res.data["assigned_to"] == manager.id
    assert res.data["subject"] == application.candidate.user_id
    assert res.data["position"] == application.position_id
    assert res.data["template_version"] == template_version.id
    evaluation_id = res.data["id"]

    section_assignments = EvaluationSectionAssignment.objects.filter(
        evaluation_id=evaluation_id
    )
    assert section_assignments.count() == 1
    assert section_assignments.first().assigned_to_id == manager.id

    evaluation_questions = EvaluationQuestion.objects.filter(
        evaluation_id=evaluation_id
    )
    assert evaluation_questions.count() == 2
    assert evaluation_questions.filter(is_mandatory=True).count() == 1


def test_assign_test_fails_when_pool_has_not_enough_optional_questions(hr_api_client):
    template = TemplateFactory.create(name="Driver Template")
    template_version = TemplateVersionFactory.create(template=template, version=1)
    section = VersionedSectionFactory.create(
        template_version=template_version,
        name="Core skills",
    )
    pool = VersionedPoolFactory.create(
        template_version=template_version,
        section=section,
        name="Pool A",
        code="pool-a-insufficient",
        random_count=2,
    )
    VersionedQuestionFactory.create(
        pool=pool,
        label="Optional 1",
        is_mandatory=False,
        order=1,
    )
    manager = UserFactory.create(
        email="manager-2@example.com",
        password="Secret123",
        role=UserRoles.MANAGER,
    )
    application = JobApplicationFactory.create(assigned_template=template)

    url = reverse(f"{BASENAME}-assign-test")
    res = hr_api_client.post(
        url,
        {"application_id": application.id, "evaluator_id": manager.id},
        format="json",
    )

    assert res.status_code == 400
    assert "template_id" in res.data


def test_assign_test_requires_manager_as_evaluator(hr_api_client):
    template = TemplateFactory.create(name="Driver Template")
    TemplateVersionFactory.create(template=template, version=1)
    non_manager = UserFactory.create(
        email="employee@example.com",
        password="Secret123",
        role=UserRoles.EMPLOYEE,
    )
    application = JobApplicationFactory.create(assigned_template=template)

    url = reverse(f"{BASENAME}-assign-test")
    res = hr_api_client.post(
        url,
        {"application_id": application.id, "evaluator_id": non_manager.id},
        format="json",
    )

    assert res.status_code == 400
    assert "evaluator_id" in res.data


def test_subject_can_list_own_evaluation_questions(api_client):
    template = TemplateFactory.create(name="Driver Template")
    template_version = TemplateVersionFactory.create(template=template, version=1)
    section = VersionedSectionFactory.create(
        template_version=template_version, name="Core"
    )
    pool = VersionedPoolFactory.create(
        template_version=template_version,
        section=section,
        name="Pool B",
        code="pool-b",
        random_count=0,
    )
    question = VersionedQuestionFactory.create(
        pool=pool,
        label="Mandatory",
        is_mandatory=True,
        order=0,
    )
    manager = UserFactory.create(
        email="manager-questions@example.com",
        password="Secret123",
        role=UserRoles.MANAGER,
    )
    subject = UserFactory.create(
        email="candidate-subject@example.com", password="Secret123"
    )
    evaluation = Evaluation.objects.create(
        subject=subject,
        template_version=template_version,
        assigned_to=manager,
        status="in_progress",
    )
    evaluation_question = EvaluationQuestion.objects.create(
        evaluation=evaluation,
        question=question,
        section=section,
        is_mandatory=True,
        order=0,
    )
    SkillAnswer.objects.create(evaluation_question=evaluation_question, value=1)

    api_client.force_authenticate(user=subject)
    url = reverse(f"{BASENAME}-questions", args=[evaluation.id])
    res = api_client.get(url)

    assert res.status_code == 200
    assert len(res.data) == 1
    assert res.data[0]["answer"] == 1


def test_subject_can_submit_answers_and_complete_evaluation(api_client):
    template = TemplateFactory.create(name="Driver Template")
    template_version = TemplateVersionFactory.create(template=template, version=1)
    section = VersionedSectionFactory.create(
        template_version=template_version, name="Core"
    )
    pool = VersionedPoolFactory.create(
        template_version=template_version,
        section=section,
        name="Pool C",
        code="pool-c",
        random_count=0,
    )
    question = VersionedQuestionFactory.create(
        pool=pool,
        label="Q1",
        is_mandatory=True,
        min_score=0,
        max_score=5,
    )
    subject = UserFactory.create(
        email="candidate-answer@example.com", password="Secret123"
    )
    evaluation = Evaluation.objects.create(
        subject=subject,
        template_version=template_version,
        status="in_progress",
    )
    evaluation_question = EvaluationQuestion.objects.create(
        evaluation=evaluation,
        question=question,
        section=section,
        is_mandatory=True,
        order=0,
    )

    api_client.force_authenticate(user=subject)
    url = reverse(f"{BASENAME}-submit-answers", args=[evaluation.id])
    res = api_client.post(
        url,
        {"answers": [{"evaluation_question_id": evaluation_question.id, "value": 4}]},
        format="json",
    )

    assert res.status_code == 200
    evaluation.refresh_from_db()
    assert evaluation.status == "completed"
    assert SkillAnswer.objects.filter(
        evaluation_question=evaluation_question, value=4
    ).exists()


def test_non_subject_cannot_submit_answers(api_client):
    template = TemplateFactory.create(name="Driver Template")
    template_version = TemplateVersionFactory.create(template=template, version=1)
    section = VersionedSectionFactory.create(
        template_version=template_version, name="Core"
    )
    pool = VersionedPoolFactory.create(
        template_version=template_version,
        section=section,
        name="Pool D",
        code="pool-d",
        random_count=0,
    )
    question = VersionedQuestionFactory.create(
        pool=pool,
        label="Q1",
        is_mandatory=True,
    )
    subject = UserFactory.create(
        email="candidate-owner@example.com", password="Secret123"
    )
    outsider = UserFactory.create(
        email="candidate-outsider@example.com", password="Secret123"
    )
    evaluation = Evaluation.objects.create(
        subject=subject,
        template_version=template_version,
        status="in_progress",
    )
    evaluation_question = EvaluationQuestion.objects.create(
        evaluation=evaluation,
        question=question,
        section=section,
        is_mandatory=True,
        order=0,
    )

    api_client.force_authenticate(user=outsider)
    url = reverse(f"{BASENAME}-submit-answers", args=[evaluation.id])
    res = api_client.post(
        url,
        {"answers": [{"evaluation_question_id": evaluation_question.id, "value": 3}]},
        format="json",
    )

    assert res.status_code == 403


def test_assigned_manager_can_validate_completed_evaluation(api_client):
    template = TemplateFactory.create(name="Driver Template")
    template_version = TemplateVersionFactory.create(template=template, version=1)
    manager = UserFactory.create(
        email="manager-validate@example.com",
        password="Secret123",
        role=UserRoles.MANAGER,
    )
    subject = UserFactory.create(
        email="candidate-validate@example.com", password="Secret123"
    )
    evaluation = Evaluation.objects.create(
        subject=subject,
        template_version=template_version,
        assigned_to=manager,
        status="completed",
    )

    api_client.force_authenticate(user=manager)
    url = reverse(f"{BASENAME}-manager-validate", args=[evaluation.id])
    res = api_client.post(
        url,
        {
            "internal_comment": "Strong practical skills.",
            "subject_comment": "Good job overall.",
        },
        format="json",
    )

    assert res.status_code == 200
    evaluation.refresh_from_db()
    assert evaluation.status == "validated"
    assert evaluation.internal_comment == "Strong practical skills."
    assert evaluation.subject_comment == "Good job overall."
    assert evaluation.validated_at is not None


def test_non_manager_cannot_validate_evaluation(api_client):
    template = TemplateFactory.create(name="Driver Template")
    template_version = TemplateVersionFactory.create(template=template, version=1)
    manager = UserFactory.create(
        email="manager-validate-2@example.com",
        password="Secret123",
        role=UserRoles.MANAGER,
    )
    outsider = UserFactory.create(email="outsider@example.com", password="Secret123")
    subject = UserFactory.create(
        email="candidate-validate-2@example.com", password="Secret123"
    )
    evaluation = Evaluation.objects.create(
        subject=subject,
        template_version=template_version,
        assigned_to=manager,
        status="completed",
    )

    api_client.force_authenticate(user=outsider)
    url = reverse(f"{BASENAME}-manager-validate", args=[evaluation.id])
    res = api_client.post(url, {}, format="json")

    assert res.status_code == 403
