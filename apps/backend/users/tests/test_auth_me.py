import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from users.models import User, UserRoles


@pytest.mark.django_db
def test_auth_me_success():
    """
    Ensure authenticated user can retrieve their own profile.
    """

    # Enterprise clean: use the manager to create users (password hashing + defaults)
    user = User.objects.create_user(
        email="me@test.com",
        password="password123",
        role=UserRoles.HR,  # stored value is "hr"
    )

    refresh = RefreshToken.for_user(user)
    access_token = str(refresh.access_token)

    client = APIClient()
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")

    url = reverse("auth-me")
    response = client.get(url)

    assert response.status_code == 200
    assert response.data["email"] == "me@test.com"

    # Enterprise clean: assert stored value, not label
    assert response.data["role"] == UserRoles.HR

    assert "id" in response.data