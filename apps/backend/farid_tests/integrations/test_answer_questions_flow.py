import pytest
from evaluations.models import SkillAnswer
from farid_tests.factories.evaluations import EvaluationFactory
from farid_tests.factories.templates import VersionedQuestionFactory


@pytest.mark.django_db
def test_answering_versioned_questions_persists_answers():
    evaluation = EvaluationFactory()
    q1 = VersionedQuestionFactory(type="soft", min_score=0, max_score=5)
    q2 = VersionedQuestionFactory(type="hard", min_score=0, max_score=5)

    a1 = SkillAnswer.objects.create(evaluation=evaluation, question=q1, value=4)
    a2 = SkillAnswer.objects.create(evaluation=evaluation, question=q2, value=3)

    assert SkillAnswer.objects.filter(evaluation=evaluation).count() == 2
    assert a1.question_id == q1.id
    assert a2.question_id == q2.id