# farid_tests/integration/test_evaluation_crud.py
import pytest
from django.urls import reverse

from evaluations.models.evaluation import Evaluation
from farid_tests.factories.users import UserFactory
from farid_tests.factories.positions import PositionFactory
from farid_tests.factories.templates_grid import TemplateFactory, TemplateVersionFactory
from farid_tests.factories.recruitment import JobApplicationFactory
from positions.models import PositionTestTemplateAssignment
from users.models import UserRoles
from templates_grid.models import (
    QuestionPool,
    SkillQuestion,
    TemplateVersion,
    TemplatePoolRule,
    TemplateSection,
)

pytestmark = pytest.mark.django_db

BASENAME = "evaluations"


def _unwrap_list_response(data):
    return data["results"] if isinstance(data, dict) and "results" in data else data


def _authenticate_as_hr(api_client):
    user = UserFactory.create(
        email="hr-evaluations@example.com", password="Passw0rd!", role=UserRoles.HR
    )
    api_client.force_authenticate(user=user)


def test_create_evaluation_success(api_client):
    _authenticate_as_hr(api_client)
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
    res = api_client.post(url, payload, format="json")

    assert res.status_code == 201
    assert "id" in res.data

    ev = Evaluation.objects.get(id=res.data["id"])
    assert ev.subject_id == subject.id
    assert ev.template_version_id == template_version.id
    assert ev.position_id == position.id
    assert ev.status == "in_progress"


def test_create_evaluation_missing_fields(api_client):
    _authenticate_as_hr(api_client)
    url = reverse(f"{BASENAME}-list")
    res = api_client.post(url, {}, format="json")

    assert res.status_code == 400
    # minimally required:
    assert "subject" in res.data
    assert "template_version" in res.data


def test_list_evaluations(api_client):
    _authenticate_as_hr(api_client)
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
    res = api_client.get(url)

    assert res.status_code == 200
    items = _unwrap_list_response(res.data)
    assert len(items) >= 2


def test_retrieve_evaluation(api_client):
    _authenticate_as_hr(api_client)
    subject = UserFactory.create(email="s2@example.com", password=None)
    template_version = TemplateVersionFactory.create(
        template=TemplateFactory.create(), version=1
    )
    ev = Evaluation.objects.create(
        subject=subject, template_version=template_version, status="in_progress"
    )

    url = reverse(f"{BASENAME}-detail", args=[ev.id])
    res = api_client.get(url)

    assert res.status_code == 200
    assert res.data["id"] == ev.id


def test_update_evaluation_status(api_client):
    _authenticate_as_hr(api_client)
    subject = UserFactory.create(email="s3@example.com", password=None)
    template_version = TemplateVersionFactory.create(
        template=TemplateFactory.create(), version=1
    )
    ev = Evaluation.objects.create(
        subject=subject, template_version=template_version, status="in_progress"
    )

    url = reverse(f"{BASENAME}-detail", args=[ev.id])
    res = api_client.patch(url, {"status": "completed"}, format="json")

    assert res.status_code in (200, 202)

    ev.refresh_from_db()
    assert ev.status == "completed"


def test_manager_only_lists_assigned_evaluations(api_client):
    manager = UserFactory.create(
        email="manager@example.com", password="Passw0rd!", role=UserRoles.MANAGER
    )
    other_manager = UserFactory.create(
        email="manager2@example.com", password="Passw0rd!", role=UserRoles.MANAGER
    )
    subject = UserFactory.create(email="subject-manager@example.com", password=None)
    template_version = TemplateVersionFactory.create(
        template=TemplateFactory.create(), version=1
    )

    owned = Evaluation.objects.create(
        subject=subject, template_version=template_version, assigned_to=manager
    )
    Evaluation.objects.create(
        subject=subject, template_version=template_version, assigned_to=other_manager
    )

    api_client.force_authenticate(user=manager)
    url = reverse(f"{BASENAME}-list")
    res = api_client.get(url)

    assert res.status_code == 200
    items = _unwrap_list_response(res.data)
    assert len(items) == 1
    assert items[0]["id"] == owned.id


def test_candidate_can_view_own_evaluation_without_internal_comment(api_client):
    candidate_user = UserFactory.create(
        email="candidate-view@example.com",
        password="Passw0rd!",
        role=UserRoles.CANDIDATE,
    )
    template_version = TemplateVersionFactory.create(
        template=TemplateFactory.create(), version=1
    )
    evaluation = Evaluation.objects.create(
        subject=candidate_user,
        template_version=template_version,
        subject_comment="Public summary",
        internal_comment="Internal-only notes",
    )

    api_client.force_authenticate(user=candidate_user)
    url = reverse(f"{BASENAME}-detail", args=[evaluation.id])
    res = api_client.get(url)

    assert res.status_code == 200
    assert res.data["id"] == evaluation.id
    assert "internal_comment" not in res.data
    assert res.data["subject_comment"] == "Public summary"


def test_launch_evaluation_from_application_success(api_client):
    _authenticate_as_hr(api_client)
    template = TemplateFactory.create(name="Launch Template")
    template_version = TemplateVersionFactory.create(template=template, version=1)
    application = JobApplicationFactory.create()

    url = reverse(f"{BASENAME}-launch")
    payload = {
        "application_id": application.id,
        "template_id": template.id,
    }
    res = api_client.post(url, payload, format="json")

    assert res.status_code == 201
    assert isinstance(res.data, list)
    assert len(res.data) == 1
    assert res.data[0]["application"] == application.id
    assert res.data[0]["template_version"] == template_version.id
    assert res.data[0]["subject"] == application.candidate.user.id
    assert res.data[0]["status"] == "in_progress"


def test_launch_evaluation_rejects_duplicate_in_progress_for_same_application(
    api_client,
):
    _authenticate_as_hr(api_client)
    template = TemplateFactory.create(name="Launch Template Duplicate")
    template_version = TemplateVersionFactory.create(template=template, version=1)
    application = JobApplicationFactory.create()

    Evaluation.objects.create(
        subject=application.candidate.user,
        application=application,
        position=application.position,
        template_version=template_version,
        status="in_progress",
    )

    url = reverse(f"{BASENAME}-launch")
    payload = {
        "application_id": application.id,
        "template_id": template.id,
    }
    res = api_client.post(url, payload, format="json")

    assert res.status_code == 400
    assert "application_id" in res.data


def test_launch_evaluation_uses_all_position_templates_with_manager_assignment(
    api_client,
):
    _authenticate_as_hr(api_client)
    manager = UserFactory.create(
        email="assigned-manager@example.com",
        password="Passw0rd!",
        role=UserRoles.MANAGER,
    )
    application = JobApplicationFactory.create()
    template_one = TemplateFactory.create(name="Template 1")
    template_two = TemplateFactory.create(name="Template 2")
    template_one_version = TemplateVersionFactory.create(
        template=template_one, version=1
    )
    template_two_version = TemplateVersionFactory.create(
        template=template_two, version=1
    )

    PositionTestTemplateAssignment.objects.create(
        position=application.position,
        template=template_one,
        manager=manager,
        order=0,
    )
    PositionTestTemplateAssignment.objects.create(
        position=application.position,
        template=template_two,
        manager=None,
        order=1,
    )

    url = reverse(f"{BASENAME}-launch")
    res = api_client.post(url, {"application_id": application.id}, format="json")

    assert res.status_code == 201
    assert len(res.data) == 2

    template_versions = {row["template_version"] for row in res.data}
    assert template_versions == {template_one_version.id, template_two_version.id}

    manager_by_template = {
        row["template_version"]: row["assigned_to"] for row in res.data
    }
    assert manager_by_template[template_one_version.id] == manager.id
    assert manager_by_template[template_two_version.id] is None


def test_launch_evaluation_creates_missing_version_for_position_template(api_client):
    _authenticate_as_hr(api_client)
    application = JobApplicationFactory.create()
    template_without_version = TemplateFactory.create(name="Template Without Version")
    PositionTestTemplateAssignment.objects.create(
        position=application.position,
        template=template_without_version,
        manager=None,
        order=0,
    )

    url = reverse(f"{BASENAME}-launch")
    res = api_client.post(url, {"application_id": application.id}, format="json")

    assert res.status_code == 201
    assert len(res.data) == 1
    created_version = TemplateVersion.objects.get(template=template_without_version)
    assert created_version.version == 1
    assert res.data[0]["template_version"] == created_version.id


def test_launch_evaluation_creates_missing_version_for_explicit_template(api_client):
    _authenticate_as_hr(api_client)
    application = JobApplicationFactory.create()
    template_without_version = TemplateFactory.create(name="Template Without Version")

    url = reverse(f"{BASENAME}-launch")
    res = api_client.post(
        url,
        {
            "application_id": application.id,
            "template_id": template_without_version.id,
        },
        format="json",
    )

    assert res.status_code == 201
    assert len(res.data) == 1
    created_version = TemplateVersion.objects.get(template=template_without_version)
    assert created_version.version == 1
    assert res.data[0]["template_version"] == created_version.id


def test_evaluation_questionnaire_get_and_save_answers(api_client):
    _authenticate_as_hr(api_client)
    application = JobApplicationFactory.create()
    template = TemplateFactory.create(name="Questionnaire Template")
    template_version = TemplateVersionFactory.create(template=template, version=1)
    section = TemplateSection.objects.create(template=template, name="Core", order=0)
    pool = QuestionPool.objects.create(name="Pool A", code="POOL_A")
    TemplatePoolRule.objects.create(
        template=template, section=section, pool=pool, random_count=0, order=0
    )
    question = SkillQuestion.objects.create(
        pool=pool,
        title="Road safety",
        text="Describe road safety checks.",
        is_mandatory=True,
        points=10,
    )
    evaluation = Evaluation.objects.create(
        subject=application.candidate.user,
        application=application,
        position=application.position,
        template_version=template_version,
        status="in_progress",
    )

    url = reverse(f"{BASENAME}-questionnaire", args=[evaluation.id])
    get_res = api_client.get(url)

    assert get_res.status_code == 200
    assert get_res.data["evaluation_id"] == evaluation.id
    assert len(get_res.data["questions"]) == 1
    assert get_res.data["questions"][0]["question_id"] == question.id

    post_res = api_client.post(
        url,
        {
            "answers": [
                {
                    "question_id": question.id,
                    "candidate_answer": "Candidate answer",
                    "manager_comment": "Manager comment",
                    "score": 8,
                }
            ]
        },
        format="json",
    )

    assert post_res.status_code == 200
    assert post_res.data["questions"][0]["candidate_answer"] == "Candidate answer"
    assert post_res.data["questions"][0]["manager_comment"] == "Manager comment"
    assert post_res.data["questions"][0]["score"] == 8


def test_evaluation_questionnaire_rejects_foreign_question(api_client):
    _authenticate_as_hr(api_client)
    application = JobApplicationFactory.create()
    template = TemplateFactory.create(name="Questionnaire Foreign Template")
    template_version = TemplateVersionFactory.create(template=template, version=1)
    evaluation = Evaluation.objects.create(
        subject=application.candidate.user,
        application=application,
        position=application.position,
        template_version=template_version,
        status="in_progress",
    )
    foreign_pool = QuestionPool.objects.create(name="Foreign", code="FOREIGN_POOL")
    foreign_question = SkillQuestion.objects.create(
        pool=foreign_pool, title="Foreign", text="Foreign question", points=5
    )

    url = reverse(f"{BASENAME}-questionnaire", args=[evaluation.id])
    res = api_client.post(
        url,
        {
            "answers": [
                {
                    "question_id": foreign_question.id,
                    "candidate_answer": "X",
                    "manager_comment": "",
                    "score": 1,
                }
            ]
        },
        format="json",
    )

    assert res.status_code == 400
    assert "answers" in res.data
