import pytest
from django.urls import reverse
from users.models import User

@pytest.mark.django_db
def test_create_user_email_exists(api_client):
    # Existing user
    User.objects.create_user(
        email="john@example.com",
        password="StrongPass123!",
        first_name="John",
        last_name="Doe",
        role="admin"
    )

    url = reverse("users-list")
    payload = {
        "email": "john@example.com",
        "password": "AnotherPass123!",
        "first_name": "Jane",
        "last_name": "Smith",
        "role": "hr"
    }

    response = api_client.post(url, payload, format="json")

    # Must return HTTP 409 Conflict
    assert response.status_code == 409
    
    assert response.data == {"error": "Email already exists."}

