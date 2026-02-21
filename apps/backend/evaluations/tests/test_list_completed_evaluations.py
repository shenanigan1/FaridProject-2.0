import pytest
from django.urls import reverse

from evaluations.models import Evaluation
from candidates.models import Candidate
from templates_grid.models import Template
from users.models import User, UserRoles


def _extract_items(response_data):
    if isinstance(response_data, dict) and "results" in response_data:
        return response_data["results"]
    return response_data


@pytest.mark.django_db
def test_list_completed_evaluations(api_client):
    """
    List all evaluations that are validated (completed).
    """

    candidate = Candidate.objects.create(
        first_name="John",
        last_name="Doe",
        email="john@example.com",
    )

    template = Template.objects.create(name="Backend Template")

    evaluator = User.objects.create_user(
        email="manager@example.com",
        password="StrongPass123!",
        role=UserRoles.MANAGER,
    )

    eval1 = Evaluation.objects.create(
        candidate=candidate,
        template=template,
        assigned_to=evaluator,
        status="validated",
    )
    eval2 = Evaluation.objects.create(
        candidate=candidate,
        template=template,
        assigned_to=evaluator,
        status="validated",
    )

    Evaluation.objects.create(
        candidate=candidate,
        template=template,
        assigned_to=evaluator,
        status="in_progress",
    )

    url = reverse("evaluations-completed")

    api_client.force_authenticate(user=evaluator)
    response = api_client.get(url)

    assert response.status_code == 200

    items = _extract_items(response.data)

    returned_ids = {item["id"] for item in items}
    assert returned_ids == {eval1.id, eval2.id}

    # Stronger contract: endpoint only returns validated evaluations
    if items and "status" in items[0]:
        assert all(item["status"] == "validated" for item in items)