import pytest
from django.urls import reverse
from evaluations.models import Evaluation
from candidates.models import Candidate
from templates_grid.models import Template
from users.models import User


@pytest.mark.django_db
def test_list_completed_evaluations(api_client):
    """
    Test: list all evaluations that are validated (completed).
    """

    # 1) Préparer les objets nécessaires
    candidate = Candidate.objects.create(
        first_name="John",
        last_name="Doe",
        email="john@example.com"
    )

    grid = Template.objects.create(name="Backend Grid")

    evaluator = User.objects.create_user(
        email="manager@example.com",
        password="StrongPass123!",
        role="MANAGER"
    )

    # Évaluations validées → doivent apparaître
    eval1 = Evaluation.objects.create(
        candidate=candidate,
        template=grid,
        assigned_to=evaluator,
        status="validated"
    )

    eval2 = Evaluation.objects.create(
        candidate=candidate,
        template=grid,
        assigned_to=evaluator,
        status="validated"
    )

    # Évaluation non validée → ne doit PAS apparaître
    Evaluation.objects.create(
        candidate=candidate,
        template=grid,
        assigned_to=evaluator,
        status="in_progress"
    )

    url = reverse("evaluations-completed")  # GET /api/evaluations/completed/

    api_client.force_authenticate(user=evaluator)
    response = api_client.get(url)

    # 2) Vérifier statut HTTP
    assert response.status_code == 200

    # 3) Vérifier que seules les évaluations validées sont listées
    returned_ids = {item["id"] for item in response.data}

    assert eval1.id in returned_ids
    assert eval2.id in returned_ids
    assert len(returned_ids) == 2  # aucune évaluation non validée
