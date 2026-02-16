import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from users.models import User
from django.contrib.auth.hashers import make_password

@pytest.mark.django_db
def test_login_success():
    """
    Ensure a valid user can log in and receive JWT tokens (access + refresh).
    """

    # Arrange — create a test user
    user = User.objects.create(
        email="test@login.com",
        password=make_password("password123"),
        role="RH"
    )

    client = APIClient()
    url = reverse("auth-login")  # will be implemented later

    payload = {
        "email": "test@login.com",
        "password": "password123"
    }

    # Act — call the API
    response = client.post(url, payload, format="json")

    # Assert — status code OK
    assert response.status_code == 200, "Login should return HTTP 200"

    # Assert — tokens are present
    assert "access" in response.data, "Response must contain an access token"
    assert "refresh" in response.data, "Response must contain a refresh token"
