import pytest
from django.conf import settings
from django.urls import reverse

from farid_tests.factories.users import UserFactory

pytestmark = pytest.mark.django_db


def test_login_success(api_client):
    user = UserFactory.create(email="u1@example.com", password="Passw0rd!")
    url = reverse("auth-login")

    res = api_client.post(
        url, {"email": user.email, "password": "Passw0rd!"}, format="json"
    )

    assert res.status_code == 200
    assert "access" in res.data
    assert "refresh" not in res.data
    assert "user" in res.data
    assert res.data["user"]["email"] == user.email
    assert "ff_refresh" in res.cookies
    assert res.cookies["ff_refresh"]["httponly"]
    assert res.cookies["ff_refresh"]["path"] == settings.JWT_REFRESH_COOKIE_PATH
    assert (
        bool(res.cookies["ff_refresh"]["secure"]) == settings.JWT_REFRESH_COOKIE_SECURE
    )
    assert res.cookies["ff_refresh"]["samesite"] in {"Lax", "None", "Strict"}


def test_login_invalid_credentials(api_client):
    UserFactory.create(email="u2@example.com", password="Passw0rd!")
    url = reverse("auth-login")

    res = api_client.post(
        url, {"email": "u2@example.com", "password": "wrong"}, format="json"
    )

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

    login = api_client.post(
        login_url, {"email": user.email, "password": "Passw0rd!"}, format="json"
    )
    token = login.data["access"]

    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
    res = api_client.get(me_url)

    assert res.status_code == 200
    assert res.data["email"] == user.email


def test_refresh_uses_httponly_cookie(api_client):
    user = UserFactory.create(email="u4@example.com", password="Passw0rd!")
    login_url = reverse("auth-login")
    refresh_url = reverse("auth-refresh")

    login = api_client.post(
        login_url, {"email": user.email, "password": "Passw0rd!"}, format="json"
    )
    api_client.cookies["ff_refresh"] = login.cookies["ff_refresh"].value

    res = api_client.post(refresh_url, {}, format="json")

    assert res.status_code == 200, res.data
    assert "access" in res.data
    assert "refresh" not in res.data
    assert "ff_refresh" in res.cookies
    assert res.cookies["ff_refresh"]["httponly"]
    assert res.cookies["ff_refresh"]["path"] == settings.JWT_REFRESH_COOKIE_PATH
    assert (
        bool(res.cookies["ff_refresh"]["secure"]) == settings.JWT_REFRESH_COOKIE_SECURE
    )


def test_logout_clears_refresh_cookie(api_client):
    user = UserFactory.create(email="u5@example.com", password="Passw0rd!")
    login_url = reverse("auth-login")
    logout_url = reverse("auth-logout")

    login = api_client.post(
        login_url, {"email": user.email, "password": "Passw0rd!"}, format="json"
    )
    api_client.cookies["ff_refresh"] = login.cookies["ff_refresh"].value

    res = api_client.post(logout_url, {}, format="json")

    assert res.status_code == 204
    assert res.cookies["ff_refresh"].value == ""
