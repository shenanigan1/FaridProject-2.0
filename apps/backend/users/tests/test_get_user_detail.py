import pytest
from django.urls import reverse
from users.models import User

@pytest.mark.django_db
def test_get_user_detail(api_client):
    # Create a user
    user = User.objects.create_user(
        email="john.doe@example.com",
        password="StrongPass123!",
        role="admin",
    )

    url = reverse("users-detail", args=[user.id])
    response = api_client.get(url)

    # Must return HTTP 200 OK
    assert response.status_code == 200

    # Check returned data
    assert response.data["id"] == user.id
    assert response.data["email"] == "john.doe@example.com"
    assert response.data["role"] == "admin"
