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


def test_users_hr_can_list_contacts(api_client):
    hr = UserFactory.create(role=UserRoles.HR, is_staff=True)
    api_client.force_authenticate(user=hr)
    url = reverse("users-list")

    res = api_client.get(url)

    assert res.status_code == 200


def test_users_hr_cannot_create_or_update_contacts(api_client):
    hr = UserFactory.create(role=UserRoles.HR, is_staff=True)
    target = UserFactory.create(role=UserRoles.MANAGER)
    api_client.force_authenticate(user=hr)

    create_res = api_client.post(
        reverse("users-list"),
        {
            "email": "blocked@example.com",
            "password": "Passw0rd!23",
            "first_name": "Blocked",
            "last_name": "User",
            "role": UserRoles.MANAGER,
        },
        format="json",
    )
    update_res = api_client.patch(
        reverse("users-detail", args=[target.id]),
        {"role": UserRoles.DIRECTOR},
        format="json",
    )

    assert create_res.status_code == 403
    assert update_res.status_code == 403
    target.refresh_from_db()
    assert target.role == UserRoles.MANAGER


def test_users_director_can_create_and_update_contacts(api_client):
    director = UserFactory.create(role=UserRoles.DIRECTOR, is_staff=True)
    target = UserFactory.create(role=UserRoles.MANAGER)
    api_client.force_authenticate(user=director)

    create_res = api_client.post(
        reverse("users-list"),
        {
            "email": "director-created@example.com",
            "password": "Passw0rd!23",
            "first_name": "Director",
            "last_name": "Created",
            "role": UserRoles.EMPLOYEE,
            "is_active": True,
        },
        format="json",
    )
    update_res = api_client.patch(
        reverse("users-detail", args=[target.id]),
        {
            "first_name": "Updated",
            "last_name": "Manager",
            "role": UserRoles.DRIVER,
        },
        format="json",
    )

    assert create_res.status_code == 201
    assert update_res.status_code == 200
    target.refresh_from_db()
    assert target.first_name == "Updated"
    assert target.last_name == "Manager"
    assert target.role == UserRoles.DRIVER


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
