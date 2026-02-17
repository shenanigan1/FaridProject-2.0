import pytest
from django.urls import reverse
from users.models import User

@pytest.mark.django_db
def test_list_users(api_client):
    # Create multiple users
    User.objects.create_user(
        email="john@example.com",
        password="StrongPass123!",
        role="admin",
    )

    User.objects.create_user(
        email="jane@example.com",
        password="StrongPass123!",
        role="hr",
    )

    url = reverse("users-list")
    response = api_client.get(url)

    # Must return HTTP 200 OK
    assert response.status_code == 200

    # Response must be a list
    assert isinstance(response.data, list)
    assert len(response.data) == 2

    # Check structure of first item
    first = response.data[0]
    assert "id" in first
    assert "email" in first
    assert "role" in first
