import pytest
from django.urls import reverse
from evaluations.models import Evaluation
from candidates.models import Candidate
from templates_grid.models import Template
from users.models import User


@pytest.mark.django_db
def test_start_evaluation_success(api_client):
    """
    Test: starting an evaluation with valid data must succeed.
    Required fields: candidate_id, grid_id, evaluator_id
    """

    # 1) Create required objects
    candidate = Candidate.objects.create(
        first_name="John",
        last_name="Doe",
        email="john@example.com"
    )

    evaluator = User.objects.create_user(
        email="manager@example.com",
        password="StrongPass123!",
        role="MANAGER"
    )

    grid = Template.objects.create(name="Backend Evaluation Grid")

    url = reverse("evaluations-start")  # POST /api/evaluations/

    payload = {
        "candidate_id": candidate.id,
        "grid_id": grid.id,
        "evaluator_id": evaluator.id
    }

    # 2) Call endpoint
    api_client.force_authenticate(user=evaluator)
    response = api_client.post(url, payload, format="json")

    # 3) Check HTTP status
    assert response.status_code == 201

    # 4) Check evaluation was created
    assert "id" in response.data
    evaluation_id = response.data["id"]

    evaluation = Evaluation.objects.get(id=evaluation_id)

    assert evaluation.candidate == candidate
    assert evaluation.template == grid
    assert evaluation.assigned_to == evaluator
    assert evaluation.status == "in_progress"
