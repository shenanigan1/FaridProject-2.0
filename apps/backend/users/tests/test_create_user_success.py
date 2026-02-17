import pytest
from django.urls import reverse
from users.models import User

@pytest.mark.django_db
def test_create_user_success(api_client):
    url = reverse("users-list")

    payload = {
        "email": "john.doe@example.com",
        "role": "admin",
        "password": "StrongPass123!"
    }


    response = api_client.post(url, payload, format="json")

    # Must return HTTP 201 Created
    assert response.status_code == 201

    # Response must contain the user ID
    assert "id" in response.data

    # Check user exists in DB
    user = User.objects.get(id=response.data["id"])
    assert user.email == payload["email"]
    assert user.role == payload["role"]
