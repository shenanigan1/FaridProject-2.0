import pytest
from django.db import IntegrityError, transaction
from farid_tests.factories.evaluations import EvaluationFactory
from farid_tests.factories.templates import VersionedQuestionFactory
from evaluations.models import SkillAnswer


@pytest.mark.django_db
def test_skill_answer_unique_per_evaluation_question():
    evaluation = EvaluationFactory()
    question = VersionedQuestionFactory()

    SkillAnswer.objects.create(evaluation=evaluation, question=question, value=3)

    with pytest.raises(IntegrityError):
        with transaction.atomic():
            SkillAnswer.objects.create(evaluation=evaluation, question=question, value=4)