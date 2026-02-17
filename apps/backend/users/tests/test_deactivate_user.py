import pytest
from django.urls import reverse
from users.models import User

@pytest.mark.django_db
def test_deactivate_user(api_client):
    # Create active user
    user = User.objects.create_user(
        email="john.doe@example.com",
        password="StrongPass123!",
        role="admin",
        is_active=True
    )

    url = reverse("users-deactivate", args=[user.id])
    response = api_client.post(url)

    # Must return HTTP 200 OK
    assert response.status_code == 200

    # Refresh from DB
    user.refresh_from_db()

    # User must be deactivated
    assert user.is_active is False
