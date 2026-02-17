import pytest
from django.urls import reverse
from users.models import User

@pytest.mark.django_db
def test_update_user(api_client):
    # Create initial user
    user = User.objects.create_user(
        email="john.doe@example.com",
        password="StrongPass123!",
        role="admin",
    )

    # New data to update
    payload = {
        "email": "john.updated@example.com",
        "role": "hr",
    }

    url = reverse("users-detail", args=[user.id])
    response = api_client.put(url, payload, format="json")

    # Must return HTTP 200 OK
    assert response.status_code == 200

    # Refresh from DB
    user.refresh_from_db()

    # Check updated values
    assert user.email == "john.updated@example.com"
    assert user.role == "hr"
