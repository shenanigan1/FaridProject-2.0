import pytest
from django.urls import reverse

from farid_tests.factories.users import UserFactory

pytestmark = pytest.mark.django_db


def test_login_success(api_client):
    user = UserFactory.create(email="u1@example.com", password="Passw0rd!")
    url = reverse("auth-login")

    res = api_client.post(url, {"email": user.email, "password": "Passw0rd!"}, format="json")

    assert res.status_code == 200
    assert "access" in res.data
    assert "refresh" in res.data
    assert "user" in res.data
    assert res.data["user"]["email"] == user.email


def test_login_invalid_credentials(api_client):
    UserFactory.create(email="u2@example.com", password="Passw0rd!")
    url = reverse("auth-login")

    res = api_client.post(url, {"email": "u2@example.com", "password": "wrong"}, format="json")

    assert res.status_code == 400
    assert "detail" in res.data


def test_me_requires_auth(api_client):
    url = reverse("auth-me")
    res = api_client.get(url)
    assert res.status_code in (401, 403)


def test_me_success(api_client):
    user = UserFactory.create(email="u3@example.com", password="Passw0rd!")
    login_url = reverse("auth-login")
    me_url = reverse("auth-me")

    login = api_client.post(login_url, {"email": user.email, "password": "Passw0rd!"}, format="json")
    token = login.data["access"]

    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
    res = api_client.get(me_url)

    assert res.status_code == 200
    assert res.data["email"] == user.email