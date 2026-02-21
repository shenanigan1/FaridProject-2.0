import pytest
from django.urls import reverse

from candidates.models import Candidate
from users.models import User, UserRoles


def _auth_client() -> APIClient:
    user = User.objects.create_user(
        email="tester@farid.com",
        password="password123",
        role=UserRoles.HR,
    )
    refresh = RefreshToken.for_user(user)
    client = APIClient()
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(refresh.access_token)}")
    return client




@pytest.mark.django_db
def test_get_candidate_detail(api_client):
    candidate = Candidate.objects.create(
        first_name="Jean",
        last_name="Dupont",
        email="jean@example.com",
        phone="0600000001",
        status="pending",
        target_position_id=3,
        flag=True,
    )

    url = reverse("candidates-detail", args=[candidate.id])
    response = client.get(url)

    assert response.status_code == 200
    assert response.data["id"] == candidate.id
    assert response.data["first_name"] == "Jean"
    assert response.data["last_name"] == "Dupont"
    assert response.data["email"] == "jean@example.com"
    assert response.data["phone"] == "0600000001"
    assert response.data["status"] == "pending"
    assert response.data["target_position_id"] == 3
    assert response.data["flag"] is True
