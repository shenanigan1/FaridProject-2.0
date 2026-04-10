import pytest
from django.urls import reverse

from farid_tests.factories.users import UserFactory
from users.models import User, UserRoles

pytestmark = pytest.mark.django_db


def test_users_admin_can_create_user_and_set_role(api_client):
    admin = UserFactory.create(role=UserRoles.ADMIN, is_staff=True)
    api_client.force_authenticate(user=admin)
    url = reverse("users-list")

    res = api_client.post(
        url,
        {
            "email": "new.manager@example.com",
            "password": "Passw0rd!23",
            "first_name": "New",
            "last_name": "Manager",
            "role": UserRoles.MANAGER,
            "is_active": True,
        },
        format="json",
    )

    assert res.status_code == 201
    created = User.objects.get(email="new.manager@example.com")
    assert created.role == UserRoles.MANAGER
    assert created.is_active is True


def test_users_non_admin_cannot_access_admin_user_management(api_client):
    hr = UserFactory.create(role=UserRoles.HR, is_staff=True)
    api_client.force_authenticate(user=hr)
    url = reverse("users-list")

    res = api_client.get(url)

    assert res.status_code == 403


def test_users_admin_can_activate_and_deactivate_user(api_client):
    admin = UserFactory.create(role=UserRoles.ADMIN, is_staff=True)
    target = UserFactory.create(role=UserRoles.MANAGER, is_active=True)
    api_client.force_authenticate(user=admin)

    deactivate_url = reverse("users-deactivate", args=[target.id])
    deactivate_res = api_client.post(deactivate_url, format="json")
    assert deactivate_res.status_code == 200

    target.refresh_from_db()
    assert target.is_active is False

    activate_url = reverse("users-activate", args=[target.id])
    activate_res = api_client.post(activate_url, format="json")
    assert activate_res.status_code == 200

    target.refresh_from_db()
    assert target.is_active is True
