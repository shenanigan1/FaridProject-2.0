import pytest
from django.urls import reverse
from evaluations.models import Evaluation, SkillAnswer
from candidates.models import Candidate
from users.models import User
from templates_grid.models import Template, QuestionPool, SkillQuestion, SkillType


@pytest.mark.django_db
def test_hard_skills_evaluation(api_client):
    """
    Test: Operational manager submits hard skills answers for an evaluation.
    """

    # 0) Créer un manager opérationnel
    operational_manager = User.objects.create_user(
        email="manager@example.com",
        password="StrongPass123!",
        role="MANAGER"
    )

    # 1) Créer un candidat
    candidate = Candidate.objects.create(
        first_name="John",
        last_name="Doe",
        email="john@example.com"
    )

    # 2) Créer un template
    template = Template.objects.create(name="Hard Skills Template")

    # 3) Créer un pool HARD
    pool = QuestionPool.objects.create(
        name="Hard Skills Pool",
        code="hard_pool"
    )
    template.pools.add(pool)

    # 4) Créer des questions HARD dans le pool
    q1 = SkillQuestion.objects.create(
        pool=pool,
        label="Python",
        type=SkillType.HARD
    )
    q2 = SkillQuestion.objects.create(
        pool=pool,
        label="Django",
        type=SkillType.HARD
    )

    # 5) Créer une évaluation
    evaluation = Evaluation.objects.create(
        candidate=candidate,
        template=template,
        status="in_progress",
        assigned_to=operational_manager
    )

    url = reverse("evaluations-hard-skills", args=[evaluation.id])

    payload = {
        "answers": [
            {"question_id": q1.id, "value": 3},
            {"question_id": q2.id, "value": 5},
        ]
    }

    api_client.force_authenticate(user=operational_manager)
    response = api_client.post(url, payload, format="json")

    assert response.status_code == 200

    saved_answers = SkillAnswer.objects.filter(evaluation=evaluation)
    assert saved_answers.count() == 2

    values = list(saved_answers.values_list("value", flat=True))
    assert sorted(values) == [3, 5]
