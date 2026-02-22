# farid_tests/integration/test_job_application_crud.py
import pytest
from django.urls import reverse

from farid_tests.factories.candidates import CandidateFactory
from farid_tests.factories.positions import PositionFactory
from recruitment.models.job_application import JobApplication

pytestmark = pytest.mark.django_db

BASENAME = "jobapplications"


def _unwrap_list_response(data):
    return data["results"] if isinstance(data, dict) and "results" in data else data


def test_create_job_application_success(api_client):
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
    JobApplication.objects.all().delete()
    JobApplication.objects.create(candidate=CandidateFactory.create(), position=PositionFactory.create())
    JobApplication.objects.create(candidate=CandidateFactory.create(), position=PositionFactory.create())

    url = reverse(f"{BASENAME}-list")
    res = api_client.get(url)

    assert res.status_code == 200
    items = _unwrap_list_response(res.data)
    assert len(items) >= 2


def test_retrieve_job_application(api_client):
    app = JobApplication.objects.create(candidate=CandidateFactory.create(), position=PositionFactory.create())

    url = reverse(f"{BASENAME}-detail", args=[app.id])
    res = api_client.get(url)

    assert res.status_code == 200
    assert res.data["id"] == app.id


def test_update_job_application_status(api_client):
    app = JobApplication.objects.create(candidate=CandidateFactory.create(), position=PositionFactory.create())

    url = reverse(f"{BASENAME}-detail", args=[app.id])
    res = api_client.patch(url, {"status": "in_review"}, format="json")

    assert res.status_code in (200, 202)

    app.refresh_from_db()
    assert app.status == "in_review"