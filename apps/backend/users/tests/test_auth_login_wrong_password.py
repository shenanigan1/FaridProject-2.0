import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from users.models import User
from django.contrib.auth.hashers import make_password

@pytest.mark.django_db
def test_login_wrong_password():
    """
    Ensure login fails when the user provides an incorrect password.
    """

    # Arrange — create a valid user
    user = User.objects.create(
        email="wrongpass@test.com",
        password=make_password("correct_password"),
        role="RH"
    )

    client = APIClient()
    url = reverse("auth-login")  # will be implemented later

    payload = {
        "email": "wrongpass@test.com",
        "password": "wrong_password"
    }

    # Act — call the API with wrong password
    response = client.post(url, payload, format="json")

    # Assert — must return 401 Unauthorized
    assert response.status_code == 401, "Login with wrong password must return HTTP 401"

    # Assert — error message must be present
    assert "detail" in response.data, "Error response must contain a 'detail' message"
    assert response.data["detail"], "Error message must not be empty"
