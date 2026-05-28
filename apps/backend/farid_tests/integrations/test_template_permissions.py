import pytest
from django.urls import reverse

from farid_tests.factories.templates_grid import QuestionPoolFactory, TemplateFactory
from farid_tests.factories.users import UserFactory
from templates_grid.models import QuestionPool, SkillQuestion, Template
from users.models import UserRoles

pytestmark = pytest.mark.django_db


@pytest.mark.parametrize(
    "role", [UserRoles.CANDIDATE, UserRoles.EMPLOYEE, UserRoles.MANAGER]
)
def test_non_hr_roles_cannot_create_template_pool_or_question(api_client, role):
    user = UserFactory.create(role=role)
    pool = QuestionPoolFactory.create(name="Protected Pool", code="PROTECTED_POOL")
    api_client.force_authenticate(user=user)

    template_res = api_client.post(
        reverse("templates-list"),
        {"name": "Blocked Template", "is_active": True},
        format="json",
    )
    pool_res = api_client.post(
        reverse("questionpools-list"),
        {"name": "Blocked Pool", "code": "BLOCKED_POOL"},
        format="json",
    )
    question_res = api_client.post(
        reverse("skillquestions-list"),
        {
            "pool": pool.id,
            "format": "yes_no",
            "title": "Blocked question",
            "text": "Blocked?",
            "explanation": "Oui",
            "points": 10,
        },
        format="json",
    )

    assert template_res.status_code == 403
    assert pool_res.status_code == 403
    assert question_res.status_code == 403
    assert not Template.objects.filter(name="Blocked Template").exists()
    assert not QuestionPool.objects.filter(code="BLOCKED_POOL").exists()
    assert not SkillQuestion.objects.filter(title="Blocked question").exists()


@pytest.mark.parametrize("role", [UserRoles.HR, UserRoles.ADMIN, UserRoles.DIRECTOR])
def test_hr_admin_direction_can_manage_templates_pools_and_questions(api_client, role):
    user = UserFactory.create(role=role, is_staff=True)
    template = TemplateFactory.create(name=f"Editable {role}")
    api_client.force_authenticate(user=user)

    template_res = api_client.patch(
        reverse("templates-detail", args=[template.id]),
        {"name": f"Updated {role}"},
        format="json",
    )
    pool_res = api_client.post(
        reverse("questionpools-list"),
        {"name": f"Pool {role}", "code": f"POOL_{role}".upper()},
        format="json",
    )
    question_res = api_client.post(
        reverse("skillquestions-list"),
        {
            "pool": pool_res.data["id"] if pool_res.status_code == 201 else None,
            "format": "yes_no",
            "title": f"Question {role}",
            "text": "Ready?",
            "explanation": "Oui",
            "points": 10,
        },
        format="json",
    )

    assert template_res.status_code == 200
    assert pool_res.status_code == 201
    assert question_res.status_code == 201
