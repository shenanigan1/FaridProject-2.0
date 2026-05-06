# farid_tests/integration/test_users_api_optional.py
import pytest
from django.urls import reverse

pytestmark = pytest.mark.django_db

# If you have these routes, set to False and adapt reverse() names.
SKIP = True


@pytest.mark.skipif(SKIP, reason="No users/auth API endpoints configured yet.")
def test_login_success(api_client):
    # Example only: update for your implementation
    url = reverse("auth-login")
    payload = {"email": "admin@example.com", "password": "Admin-123"}
    res = api_client.post(url, payload, format="json")
    assert res.status_code == 200
    assert "token" in res.data or "access" in res.data


@pytest.mark.skipif(SKIP, reason="No users/auth API endpoints configured yet.")
def test_me_endpoint(api_client):
    # Example only: update for your implementation
    url = reverse("users-me")
    res = api_client.get(url)
    assert res.status_code in (200, 401)
