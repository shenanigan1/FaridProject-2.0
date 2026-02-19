import pytest
from django.urls import reverse
from evaluations.models import Evaluation, SkillAnswer
from candidates.models import Candidate
from users.models import User
from templates_grid.models import Template, QuestionPool, SkillQuestion, SkillType


@pytest.mark.django_db
def test_soft_skills_evaluation(api_client):
    """
    Test: RH submits soft skills answers for an evaluation.
    """

    # 0) Créer un utilisateur RH
    rh_user = User.objects.create_user(
        email="rh@example.com",
        password="StrongPass123!",
        role="HR"
    )

    # 1) Créer un candidat
    candidate = Candidate.objects.create(
        first_name="John",
        last_name="Doe",
        email="john@example.com"
    )

    # 2) Créer un template
    template = Template.objects.create(name="Soft Skills Template")

    # 3) Créer un pool SOFT
    pool = QuestionPool.objects.create(
        name="Soft Skills Pool",
        code="soft_pool"
    )
    template.pools.add(pool)

    # 4) Créer des questions SOFT dans le pool
    q1 = SkillQuestion.objects.create(
        pool=pool,
        label="Communication",
        type=SkillType.SOFT
    )
    q2 = SkillQuestion.objects.create(
        pool=pool,
        label="Teamwork",
        type=SkillType.SOFT
    )

    # 5) Créer une évaluation
    evaluation = Evaluation.objects.create(
        candidate=candidate,
        template=template,
        status="in_progress",
        assigned_to=rh_user
    )

    url = reverse("evaluations-soft-skills", args=[evaluation.id])

    payload = {
        "answers": [
            {"question_id": q1.id, "value": 4},
            {"question_id": q2.id, "value": 5},
        ]
    }

    api_client.force_authenticate(user=rh_user)
    response = api_client.post(url, payload, format="json")

    assert response.status_code == 200

    saved_answers = SkillAnswer.objects.filter(evaluation=evaluation)
    assert saved_answers.count() == 2

    values = list(saved_answers.values_list("value", flat=True))
    assert sorted(values) == [4, 5]
