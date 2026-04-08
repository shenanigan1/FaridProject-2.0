# farid_tests/integration/test_candidate_crud.py
import pytest
from django.urls import reverse

from candidates.models import Candidate
from farid_tests.factories import CandidateFactory, PositionFactory, UserFactory
from users.models import User, UserRoles

pytestmark = pytest.mark.django_db


@pytest.fixture
def hr_api_client(api_client):
    hr_user = UserFactory.create(
        email="hr@example.com",
        password="Secret123",
        role=UserRoles.HR,
    )
    api_client.force_authenticate(user=hr_user)
    return api_client


def test_create_candidate_success(api_client):
    url = reverse("candidates-list")

    payload = {
        "user": {
            "first_name": "Jean",
            "last_name": "Dupont",
            "email": "jean.dupont@example.com",
            "phone": "0601020304",
        },
        "status": "pending",
        "flag": False,
        "target_position": None,
    }

    response = api_client.post(url, payload, format="json")

    assert response.status_code == 201
    assert "id" in response.data

    candidate = Candidate.objects.select_related("user").get(id=response.data["id"])
    assert candidate.user.email == "jean.dupont@example.com"
    assert candidate.user.first_name == "Jean"
    assert candidate.user.last_name == "Dupont"
    assert candidate.user.phone == "0601020304"
    assert candidate.status == "pending"
    assert candidate.flag is False


def test_create_candidate_with_password_can_login(api_client):
    candidate_url = reverse("candidates-list")
    payload = {
        "user": {
            "first_name": "Lina",
            "last_name": "Candidate",
            "email": "lina.login@example.com",
            "phone": "0600000000",
            "password": "Secret123",
        }
    }

    candidate_res = api_client.post(candidate_url, payload, format="json")
    assert candidate_res.status_code == 201

    login_url = reverse("auth-login")
    login_res = api_client.post(
        login_url,
        {"email": "lina.login@example.com", "password": "Secret123"},
        format="json",
    )

    assert login_res.status_code == 200
    assert "access" in login_res.data
    assert "refresh" in login_res.data


def test_create_candidate_with_weak_password_rejected(api_client):
    candidate_url = reverse("candidates-list")
    payload = {
        "user": {
            "first_name": "Weak",
            "last_name": "Password",
            "email": "weak.password@example.com",
            "phone": "0600000000",
            "password": "123",
        }
    }

    response = api_client.post(candidate_url, payload, format="json")

    assert response.status_code == 400
    assert "user" in response.data
    assert "password" in response.data["user"]


def test_create_candidate_missing_user(api_client):
    url = reverse("candidates-list")

    response = api_client.post(url, {}, format="json")

    assert response.status_code == 400
    assert "user" in response.data


def test_create_candidate_missing_user_fields(api_client):
    url = reverse("candidates-list")

    response = api_client.post(url, {"user": {}}, format="json")

    assert response.status_code == 400
    assert "user" in response.data
    assert "email" in response.data["user"]
    # Depending on your serializer, first_name/last_name may be required or optional.
    # If required, keep these assertions; otherwise remove them.
    assert "first_name" in response.data["user"]
    assert "last_name" in response.data["user"]


def test_create_candidate_duplicate_email_rejected(api_client):
    url = reverse("candidates-list")

    # Pre-existing user with same email
    User.objects.create_user(email="dup@example.com", password=None)

    payload = {
        "user": {
            "first_name": "X",
            "last_name": "Y",
            "email": "dup@example.com",
            "phone": "",
        }
    }

    response = api_client.post(url, payload, format="json")

    assert response.status_code == 400
    # your serializer should attach the error to user.email ideally
    assert "user" in response.data


def test_list_candidates(hr_api_client):
    CandidateFactory.create(email="a@example.com")
    CandidateFactory.create(email="b@example.com")

    url = reverse("candidates-list")
    response = hr_api_client.get(url)

    assert response.status_code == 200
    # Supports both list and paginated responses
    data = (
        response.data["results"]
        if isinstance(response.data, dict) and "results" in response.data
        else response.data
    )
    assert len(data) >= 2


def test_retrieve_candidate(hr_api_client):
    candidate = CandidateFactory.create(email="one@example.com")

    url = reverse("candidates-detail", args=[candidate.id])
    response = hr_api_client.get(url)

    assert response.status_code == 200
    assert response.data["id"] == candidate.id


def test_update_candidate_flag(hr_api_client):
    candidate = CandidateFactory.create(email="flag@example.com")

    url = reverse("candidates-detail", args=[candidate.id])
    response = hr_api_client.patch(url, {"flag": True}, format="json")

    assert response.status_code in (200, 202)  # depending on your viewset config

    candidate.refresh_from_db()
    assert candidate.flag is True


def test_update_candidate_target_position(hr_api_client):
    candidate = CandidateFactory.create(email="tp@example.com")
    pos = PositionFactory.create(title="Forklift Driver")

    url = reverse("candidates-detail", args=[candidate.id])
    response = hr_api_client.patch(url, {"target_position": pos.id}, format="json")

    assert response.status_code in (200, 202)

    candidate.refresh_from_db()
    assert candidate.target_position_id == pos.id


def test_update_candidate_duplicate_email_rejected(hr_api_client):
    existing = CandidateFactory.create(email="existing@example.com")
    candidate = CandidateFactory.create(email="to-update@example.com")

    url = reverse("candidates-detail", args=[candidate.id])
    response = hr_api_client.patch(
        url,
        {"user": {"email": existing.user.email}},
        format="json",
    )

    assert response.status_code == 400
    assert "user" in response.data
    assert "email" in response.data["user"]


def test_update_candidate_with_weak_password_rejected(hr_api_client):
    candidate = CandidateFactory.create(email="candidate@example.com")

    url = reverse("candidates-detail", args=[candidate.id])
    response = hr_api_client.patch(
        url,
        {"user": {"password": "123"}},
        format="json",
    )

    assert response.status_code == 400
    assert "user" in response.data
    assert "password" in response.data["user"]


def test_update_candidate_is_atomic_when_nested_user_update_fails(hr_api_client):
    existing = CandidateFactory.create(email="already-used@example.com")
    candidate = CandidateFactory.create(email="atomic@example.com")

    url = reverse("candidates-detail", args=[candidate.id])
    response = hr_api_client.patch(
        url,
        {
            "flag": True,
            "user": {"email": existing.user.email},
        },
        format="json",
    )

    assert response.status_code == 400
    candidate.refresh_from_db()
    assert candidate.flag is False


def test_list_candidates_requires_hr_permissions(api_client):
    CandidateFactory.create(email="a@example.com")
    url = reverse("candidates-list")

    response = api_client.get(url)

    assert response.status_code == 401
