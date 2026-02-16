import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from django.contrib.auth.hashers import make_password
from users.models import User
from rest_framework_simplejwt.tokens import RefreshToken

@pytest.mark.django_db
def test_auth_me_success():
    """
    Ensure authenticated user can retrieve their own profile.
    """

    user = User.objects.create(
        email="me@test.com",
        password=make_password("password123"),
        role="RH"
    )

    refresh = RefreshToken.for_user(user)
    access_token = str(refresh.access_token)

    client = APIClient()
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")

    url = reverse("auth-me")
    response = client.get(url)

    assert response.status_code == 200
    assert response.data["email"] == "me@test.com"
    assert response.data["role"] == "RH"
    assert "id" in response.data
