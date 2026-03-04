# farid_tests/integration/test_templates_grid_crud.py
import pytest
from django.urls import reverse

from farid_tests.factories.users import UserFactory
from users.models.roles import UserRoles
from farid_tests.factories.templates_grid import (
    QuestionPoolFactory,
    TemplateFactory,
    TemplateSectionFactory,
)

pytestmark = pytest.mark.django_db

BASENAME_POOLS = "questionpools"
BASENAME_QUESTIONS = "skillquestions"
BASENAME_TEMPLATES = "templates"
BASENAME_SECTIONS = "templatesections"
BASENAME_RULES = "templatepoolrules"


def _unwrap_list_response(data):
    return data["results"] if isinstance(data, dict) and "results" in data else data


def test_create_question_pool_success(api_client):
    url = reverse(f"{BASENAME_POOLS}-list")
    payload = {"name": "Soft Skills", "code": "soft_skills", "description": "desc"}

    res = api_client.post(url, payload, format="json")

    assert res.status_code == 201
    assert res.data["name"] == "Soft Skills"
    assert res.data["code"] == "soft_skills"


def test_create_question_pool_duplicate_code_rejected(api_client):
    QuestionPoolFactory.create(name="P1", code="dup_code")
    url = reverse(f"{BASENAME_POOLS}-list")

    res = api_client.post(url, {"name": "P2", "code": "dup_code"}, format="json")

    assert res.status_code == 400
    assert "code" in res.data


def test_create_skill_question_success(api_client):
    user = UserFactory.create(is_staff=True, role=UserRoles.ADMIN)
    api_client.force_authenticate(user=user)
    pool = QuestionPoolFactory.create(name="Pool", code="POOL_CODE")
    url = reverse(f"{BASENAME_QUESTIONS}-list")

    payload = {
        "pool": pool.id,
        "title": "Communication",
        "text": "TESTING",
        "is_mandatory": True,
        "points": 1,
        "order": 1,
    }

    res = api_client.post(url, payload, format="json")

    assert res.status_code == 201, res.data
    assert res.data["title"] == "Communication"
    assert res.data["pool"] == pool.id


def test_create_template_success(api_client):
    url = reverse(f"{BASENAME_TEMPLATES}-list")
    payload = {"name": "Driver Template", "is_active": True}

    res = api_client.post(url, payload, format="json")

    assert res.status_code == 201
    assert res.data["name"] == "Driver Template"


def test_create_template_section_success(api_client):
    template = TemplateFactory.create()
    url = reverse(f"{BASENAME_SECTIONS}-list")

    payload = {"template": template.id, "name": "Section A", "order": 0}

    res = api_client.post(url, payload, format="json")

    assert res.status_code == 201
    assert res.data["name"] == "Section A"
    assert res.data["template"] == template.id


def test_create_template_pool_rule_success(api_client):
    template = TemplateFactory.create()
    section = TemplateSectionFactory.create(template=template)
    pool = QuestionPoolFactory.create(code="pool_for_rule")

    url = reverse(f"{BASENAME_RULES}-list")

    payload = {
        "template": template.id,
        "section": section.id,
        "pool": pool.id,
        "random_count": 3,
        "order": 0,
    }

    res = api_client.post(url, payload, format="json")

    assert res.status_code == 201
    assert res.data["template"] == template.id
    assert res.data["section"] == section.id
    assert res.data["pool"] == pool.id
    assert res.data["random_count"] == 3


def test_list_templates(api_client):
    TemplateFactory.create(name="A")
    TemplateFactory.create(name="B")

    url = reverse(f"{BASENAME_TEMPLATES}-list")
    res = api_client.get(url)

    assert res.status_code == 200
    items = _unwrap_list_response(res.data)
    assert len(items) >= 2
