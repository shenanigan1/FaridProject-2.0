import pytest
from django.urls import reverse
from rest_framework_simplejwt.tokens import RefreshToken

from evaluations.models import Evaluation
from candidates.models import Candidate
from templates_grid.models import Template
from users.models import User, UserRoles


def _extract_items(response_data):
    # Support both paginated and non-paginated responses
    if isinstance(response_data, dict) and "results" in response_data:
        return response_data["results"]
    return response_data


@pytest.mark.django_db
def test_evaluation_history(api_client):
    """
    Retrieve chronological evaluation history for a candidate.
    """

    candidate = Candidate.objects.create(
        first_name="John",
        last_name="Doe",
        email="john@example.com",
    )
    other_candidate = Candidate.objects.create(
        first_name="Jane",
        last_name="Smith",
        email="jane@example.com",
    )

    template = Template.objects.create(name="Backend Template")

    evaluator = User.objects.create_user(
        email="manager@example.com",
        password="StrongPass123!",
        role=UserRoles.MANAGER,  # stored value: "manager"
    )

    # Create two evaluations for the candidate
    eval_old = Evaluation.objects.create(
        candidate=candidate,
        template=template,
        assigned_to=evaluator,
        status="validated",
    )
    eval_recent = Evaluation.objects.create(
        candidate=candidate,
        template=template,
        assigned_to=evaluator,
        status="validated",
    )

    # Another candidate evaluation must not appear
    Evaluation.objects.create(
        candidate=other_candidate,
        template=template,
        assigned_to=evaluator,
        status="validated",
    )

    url = reverse("evaluations-history", args=[candidate.id])

    # Use force_authenticate since api_client fixture is DRF APIClient
    api_client.force_authenticate(user=evaluator)
    response = api_client.get(url)

    assert response.status_code == 200

    items = _extract_items(response.data)

    # Only the candidate's evaluations are returned
    returned_ids = [item["id"] for item in items]
    assert set(returned_ids) == {eval_old.id, eval_recent.id}
    assert len(returned_ids) == 2

    # Enterprise-clean chronological check: compare created_at (if exposed)
    if items and "created_at" in items[0]:
        returned_dates = [item["created_at"] for item in items]
        assert returned_dates == sorted(returned_dates), "History should be ordered chronologically (created_at)"
    else:
        # Fallback: if API doesn't expose created_at, enforce a stable order by id ascending
        assert returned_ids == sorted(returned_ids)