import pytest
from django.contrib.auth.hashers import make_password
from django.urls import reverse
from rest_framework.test import APIClient

from users.models import User

pytest.importorskip("rest_framework_simplejwt.tokens")


@pytest.mark.django_db
def test_login_success():
    user = User.objects.create(
        email="test@login.com",
        password=make_password("password123"),
        role="hr",
    )

    client = APIClient()
    url = reverse("auth-login")

    payload = {
        "email": "test@login.com",
        "password": "password123",
    }

    response = client.post(url, payload, format="json")

    assert response.status_code == 200
    assert "access" in response.data
    assert "refresh" in response.data
