import pytest
from django.urls import reverse

from users.models import User, UserRoles


@pytest.mark.django_db
def test_create_user_success(api_client):
    url = reverse("users-list")

    payload = {
        "email": "john.doe@example.com",
        "role": UserRoles.ADMIN,
        "password": "StrongPass123!",
        "first_name": "John",
        "last_name": "Doe",
    }

    response = api_client.post(url, payload, format="json")

    assert response.status_code == 201
    assert "id" in response.data

    user = User.objects.get(id=response.data["id"])
    assert user.email == payload["email"]
    assert user.role == payload["role"]
    assert user.first_name == payload["first_name"]
    assert user.last_name == payload["last_name"]
    assert user.check_password(payload["password"])
