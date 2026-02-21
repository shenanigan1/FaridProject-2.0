import pytest
from django.urls import reverse

from users.models import User, UserRoles


@pytest.mark.django_db
def test_start_evaluation_missing_fields(api_client):
    """
    Starting an evaluation must fail if required fields are missing.
    Required:
        - candidate_id
        - assigned_to_id
        - template_id
    """

    # Create authenticated user
    user = User.objects.create_user(
        email="hr@test.com",
        password="StrongPass123!",
        role=UserRoles.HR,
    )

    api_client.force_authenticate(user=user)

    url = reverse("evaluations-start")

    # --- Missing candidate_id ---
    payload = {
        "assigned_to_id": 1,
        "template_id": 1,
    }

    response = api_client.post(url, payload, format="json")
    assert response.status_code == 400
    assert "candidate_id" in response.data

    # --- Missing assigned_to_id ---
    payload = {
        "candidate_id": 1,
        "template_id": 1,
    }

    response = api_client.post(url, payload, format="json")
    assert response.status_code == 400
    assert "assigned_to_id" in response.data

    # --- Missing template_id ---
    payload = {
        "candidate_id": 1,
        "assigned_to_id": 1,
    }

    response = api_client.post(url, payload, format="json")
    assert response.status_code == 400
    assert "template_id" in response.data