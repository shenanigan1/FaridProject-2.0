import pytest
from django.urls import reverse
from evaluations.models import Evaluation
from users.models import User
from candidates.models import Candidate
from templates_grid.models import Template


@pytest.mark.django_db
def test_validate_evaluation(api_client):
    """
    Test: final validation of an evaluation by HR or Direction.
    """

    # 1) Préparer les objets nécessaires
    candidate = Candidate.objects.create(
        first_name="John",
        last_name="Doe",
        email="john@example.com"
    )

    grid = Template.objects.create(name="Backend Grid")

    hr_user = User.objects.create_user(
        email="hr@example.com",
        password="StrongPass123!",
        role="HR"
    )

    evaluation = Evaluation.objects.create(
        candidate=candidate,
        template=grid,
        assigned_to=hr_user,
        status="completed"  # Soft + Hard skills done
    )

    url = reverse("evaluations-validate", args=[evaluation.id])

    # 2) Authentifier RH
    api_client.force_authenticate(user=hr_user)

    # 3) Appeler l’endpoint
    response = api_client.post(url, format="json")

    # 4) Vérifier statut HTTP
    assert response.status_code == 200

    # 5) Vérifier mise à jour du statut
    evaluation.refresh_from_db()
    assert evaluation.status == "validated"
