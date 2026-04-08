# farid_tests/integration/test_evaluation_crud.py
import pytest
from django.urls import reverse

from evaluations.models.evaluation import Evaluation
from farid_tests.factories.users import UserFactory
from farid_tests.factories.positions import PositionFactory
from farid_tests.factories.recruitment import JobApplicationFactory
from farid_tests.factories.templates_grid import TemplateFactory, TemplateVersionFactory
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
