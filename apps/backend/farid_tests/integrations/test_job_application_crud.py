# farid_tests/integration/test_job_application_crud.py
import pytest
from django.urls import reverse

from farid_tests.factories.candidates import CandidateFactory
from farid_tests.factories.positions import PositionFactory
from farid_tests.factories.users import UserFactory
from recruitment.models.job_application import JobApplication
from users.models import UserRoles

pytestmark = pytest.mark.django_db

BASENAME = "jobapplications"


def _unwrap_list_response(data):
    return data["results"] if isinstance(data, dict) and "results" in data else data


def _authenticate_as_hr(api_client):
    user = UserFactory.create(
        email="hr-job-apps@example.com", password="Passw0rd!", role=UserRoles.HR
    )
    api_client.force_authenticate(user=user)


def test_create_job_application_success(api_client):
    _authenticate_as_hr(api_client)
    candidate = CandidateFactory.create(email="cand@app.com")
    position = PositionFactory.create(title="Truck Driver")

    url = reverse(f"{BASENAME}-list")
    payload = {"candidate": candidate.id, "position": position.id, "status": "applied"}

    res = api_client.post(url, payload, format="json")

    assert res.status_code == 201
    assert "id" in res.data
    assert res.data["candidate"] == candidate.id
    assert res.data["position"] == position.id

    assert JobApplication.objects.filter(id=res.data["id"]).exists()


def test_create_job_application_duplicate_rejected(api_client):
    _authenticate_as_hr(api_client)
    candidate = CandidateFactory.create(email="cand2@app.com")
    position = PositionFactory.create(title="Forklift Driver")

    JobApplication.objects.create(candidate=candidate, position=position)

    url = reverse(f"{BASENAME}-list")
    payload = {"candidate": candidate.id, "position": position.id, "status": "applied"}

    res = api_client.post(url, payload, format="json")

    assert res.status_code == 400
    # Depending on serializer, error may be non_field_errors or a field-level error
    assert any(k in res.data for k in ("non_field_errors", "candidate", "position"))


def test_list_job_applications(api_client):
    _authenticate_as_hr(api_client)
    JobApplication.objects.all().delete()
    JobApplication.objects.create(
        candidate=CandidateFactory.create(), position=PositionFactory.create()
    )
    JobApplication.objects.create(
        candidate=CandidateFactory.create(), position=PositionFactory.create()
    )

    url = reverse(f"{BASENAME}-list")
    res = api_client.get(url)

    assert res.status_code == 200
    items = _unwrap_list_response(res.data)
    assert len(items) >= 2


def test_list_job_applications_can_filter_by_position_with_candidate_summary(
    api_client,
):
    _authenticate_as_hr(api_client)
    JobApplication.objects.all().delete()
    target_position = PositionFactory.create(title="Launchable Driver")
    other_position = PositionFactory.create(title="Other Driver")
    target_candidate = CandidateFactory.create(
        first_name="Marc",
        last_name="Lambert",
        email="marc.launch@example.com",
        phone="+33123456789",
    )
    target_application = JobApplication.objects.create(
        candidate=target_candidate,
        position=target_position,
    )
    JobApplication.objects.create(
        candidate=CandidateFactory.create(),
        position=other_position,
    )

    url = reverse(f"{BASENAME}-list")
    res = api_client.get(url, {"position": target_position.id})

    assert res.status_code == 200
    items = _unwrap_list_response(res.data)
    assert len(items) == 1
    assert items[0]["id"] == target_application.id
    assert items[0]["position"] == target_position.id
    assert items[0]["candidate"] == target_candidate.id
    assert items[0]["candidate_full_name"] == "Marc Lambert"
    assert items[0]["candidate_email"] == "marc.launch@example.com"
    assert items[0]["candidate_phone"] == "+33123456789"


def test_retrieve_job_application(api_client):
    _authenticate_as_hr(api_client)
    app = JobApplication.objects.create(
        candidate=CandidateFactory.create(), position=PositionFactory.create()
    )

    url = reverse(f"{BASENAME}-detail", args=[app.id])
    res = api_client.get(url)

    assert res.status_code == 200
    assert res.data["id"] == app.id


def test_update_job_application_status(api_client):
    _authenticate_as_hr(api_client)
    app = JobApplication.objects.create(
        candidate=CandidateFactory.create(), position=PositionFactory.create()
    )

    url = reverse(f"{BASENAME}-detail", args=[app.id])
    res = api_client.patch(url, {"status": "in_review"}, format="json")

    assert res.status_code in (200, 202)

    app.refresh_from_db()
    assert app.status == "in_review"


def test_candidate_can_only_create_for_own_profile(api_client):
    candidate = CandidateFactory.create(email="owner@app.com")
    other_candidate = CandidateFactory.create(email="other@app.com")
    position = PositionFactory.create(title="Driver A")

    api_client.force_authenticate(user=candidate.user)
    url = reverse(f"{BASENAME}-list")

    res = api_client.post(
        url,
        {"candidate": other_candidate.id, "position": position.id, "status": "applied"},
        format="json",
    )

    assert res.status_code == 403


def test_candidate_list_is_scoped_to_own_applications(api_client):
    owned_candidate = CandidateFactory.create(email="owned@app.com")
    other_candidate = CandidateFactory.create(email="foreign@app.com")
    owned_application = JobApplication.objects.create(
        candidate=owned_candidate,
        position=PositionFactory.create(title="Owned position"),
    )
    JobApplication.objects.create(
        candidate=other_candidate,
        position=PositionFactory.create(title="Foreign position"),
    )

    api_client.force_authenticate(user=owned_candidate.user)
    url = reverse(f"{BASENAME}-list")
    res = api_client.get(url)

    assert res.status_code == 200
    items = _unwrap_list_response(res.data)
    assert len(items) == 1
    assert items[0]["id"] == owned_application.id
