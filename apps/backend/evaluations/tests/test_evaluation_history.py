import pytest
from django.urls import reverse
from evaluations.models import Evaluation
from candidates.models import Candidate
from templates_grid.models import Template
from users.models import User


@pytest.mark.django_db
def test_evaluation_history(api_client):
    """
    Test: retrieve chronological evaluation history for a candidate.
    """

    # 1) Préparer les objets nécessaires
    candidate = Candidate.objects.create(
        first_name="John",
        last_name="Doe",
        email="john@example.com"
    )

    other_candidate = Candidate.objects.create(
        first_name="Jane",
        last_name="Smith",
        email="jane@example.com"
    )

    grid = Template.objects.create(name="Backend Grid")

    evaluator = User.objects.create_user(
        email="manager@example.com",
        password="StrongPass123!",
        role="MANAGER"
    )

    # Historique du candidat (dans le désordre volontairement)
    eval_old = Evaluation.objects.create(
        candidate=candidate,
        template=grid,
        assigned_to=evaluator,
        status="validated"
    )

    eval_recent = Evaluation.objects.create(
        candidate=candidate,
        template=grid,
        assigned_to=evaluator,
        status="validated"
    )

    # Évaluation d’un autre candidat → ne doit PAS apparaître
    Evaluation.objects.create(
        candidate=other_candidate,
        template=grid,
        assigned_to=evaluator,
        status="validated"
    )

    url = reverse("evaluations-history", args=[candidate.id])  # GET /api/evaluations/{id}/history/

    api_client.force_authenticate(user=evaluator)
    response = api_client.get(url)

    # 2) Vérifier statut HTTP
    assert response.status_code == 200

    # 3) Vérifier que seules les évaluations du candidat sont retournées
    returned_ids = [item["id"] for item in response.data]
    assert returned_ids == sorted(returned_ids)  # tri chronologique
    assert eval_old.id in returned_ids
    assert eval_recent.id in returned_ids
    assert len(returned_ids) == 2
