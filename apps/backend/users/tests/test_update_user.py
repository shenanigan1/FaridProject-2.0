import pytest
from django.urls import reverse

from users.models import User, UserRoles


@pytest.mark.django_db
def test_update_user(api_client):
    user = User.objects.create_user(
        email="john.doe@example.com",
        password="StrongPass123!",
        role=UserRoles.ADMIN,
    )

    payload = {
        "email": "john.updated@example.com",
        "role": UserRoles.HR,
        "first_name": "John",
        "last_name": "Updated",
    }

    url = reverse("users-detail", args=[user.id])
    response = api_client.put(url, payload, format="json")

    assert response.status_code == 200

    user.refresh_from_db()
    assert user.email == "john.updated@example.com"
    assert user.role == UserRoles.HR
    assert user.first_name == "John"
    assert user.last_name == "Updated"
