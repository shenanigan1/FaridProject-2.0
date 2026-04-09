# farid_tests/integration/test_evaluation_crud.py
import pytest
from django.urls import reverse

from evaluations.models.evaluation import Evaluation
from farid_tests.factories.users import UserFactory
from farid_tests.factories.positions import PositionFactory
from farid_tests.factories.templates_grid import TemplateFactory, TemplateVersionFactory
from users.models import UserRoles

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
