import pytest
from django.contrib.auth.hashers import make_password
from django.urls import reverse
from rest_framework.test import APIClient

from users.models import User, UserRoles

from rest_framework_simplejwt.tokens import RefreshToken


def auth_client(user):
    refresh = RefreshToken.for_user(user)
    token = str(refresh.access_token)
    client = APIClient()
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
    return client


@pytest.mark.django_db
def test_admin_permission():
    user = User.objects.create(
        email="admin@test.com",
        password=make_password("pass"),
        role=UserRoles.ADMIN,
    )

    client = auth_client(user)
    response = client.get(reverse("admin-only-endpoint"))

    assert response.status_code == 200


@pytest.mark.django_db
def test_hr_permission():
    user = User.objects.create(
        email="hr@test.com",
        password=make_password("pass"),
        role=UserRoles.HR,
    )

    client = auth_client(user)
    response = client.get(reverse("hr-only-endpoint"))

    assert response.status_code == 200


@pytest.mark.django_db
def test_forbidden_for_wrong_role():
    user = User.objects.create(
        email="employee@test.com",
        password=make_password("pass"),
        role=UserRoles.EMPLOYEE,
    )

    client = auth_client(user)
    response = client.get(reverse("hr-only-endpoint"))

    assert response.status_code == 403
