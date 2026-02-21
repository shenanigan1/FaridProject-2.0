import pytest
from django.contrib.auth.hashers import make_password
from django.urls import reverse
from rest_framework.test import APIClient

from users.models import User


@pytest.mark.django_db
def test_login_wrong_password():
    user = User.objects.create(
        email="wrongpass@test.com",
        password=make_password("correct_password"),
        role="hr",
    )

    client = APIClient()
    url = reverse("auth-login")

    payload = {
        "email": "wrongpass@test.com",
        "password": "wrong_password",
    }

    response = client.post(url, payload, format="json")

    assert response.status_code == 401
    assert "detail" in response.data
    assert response.data["detail"]
