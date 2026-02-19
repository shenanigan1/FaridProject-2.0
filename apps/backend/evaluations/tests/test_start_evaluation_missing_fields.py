import pytest
from django.urls import reverse

@pytest.mark.django_db
def test_start_evaluation_missing_fields(api_client):
    """
    Test: starting an evaluation must fail if required fields are missing.
    Required: candidate_id, evaluator_id, grid_id
    """

    url = reverse("evaluations-start")  # endpoint POST /evaluations/start/

    # Missing candidate_id
    payload = {
        "evaluator_id": 1,
        "grid_id": 1
    }

    response = api_client.post(url, payload, format="json")

    assert response.status_code == 400
    assert "candidate_id" in response.data

    # Missing evaluator_id
    payload = {
        "candidate_id": 1,
        "grid_id": 1
    }

    response = api_client.post(url, payload, format="json")

    assert response.status_code == 400
    assert "evaluator_id" in response.data

    # Missing grid_id
    payload = {
        "candidate_id": 1,
        "evaluator_id": 1
    }

    response = api_client.post(url, payload, format="json")

    assert response.status_code == 400
    assert "grid_id" in response.data
