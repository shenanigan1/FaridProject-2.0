import pytest
from django.urls import reverse

from evaluations.models import Evaluation
from candidates.models import Candidate
from templates_grid.models import Template
from users.models import User, UserRoles


@pytest.mark.django_db
def test_start_evaluation_success(api_client):
    """
    Starting an evaluation with valid data must succeed.
    Required fields:
        - candidate_id
        - template_id
        - assigned_to_id
    """

    candidate = Candidate.objects.create(
        first_name="John",
        last_name="Doe",
        email="john@example.com",
    )

    evaluator = User.objects.create_user(
        email="manager@example.com",
        password="StrongPass123!",
        role=UserRoles.MANAGER,
    )

    template = Template.objects.create(name="Backend Evaluation Template")

    url = reverse("evaluations-start")

    payload = {
        "candidate_id": candidate.id,
        "template_id": template.id,
        "assigned_to_id": evaluator.id,
    }

    api_client.force_authenticate(user=evaluator)
    response = api_client.post(url, payload, format="json")

    assert response.status_code == 201
    assert "id" in response.data

    evaluation = Evaluation.objects.get(id=response.data["id"])

    assert evaluation.candidate_id == candidate.id
    assert evaluation.template_id == template.id
    assert evaluation.assigned_to_id == evaluator.id
    assert evaluation.status == "in_progress"