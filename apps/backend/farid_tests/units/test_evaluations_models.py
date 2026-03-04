# farid_tests/unit/test_evaluations_models.py
import pytest
from django.core.exceptions import ValidationError
from django.db import IntegrityError

from farid_tests.factories.evaluations import (
    EvaluationFactory,
    EvaluationQuestionFactory,
    SkillAnswerFactory,
    EvaluationSectionAssignmentFactory,
    EvaluationCommentFactory,
)

pytestmark = pytest.mark.django_db


def test_evaluation_str_contains_status_and_subject():
    ev = EvaluationFactory.create()
    s = str(ev)
    assert "Evaluation" in s
    assert ev.status in s


def test_evaluation_question_unique_per_eval_question():
    eq = EvaluationQuestionFactory.create(order=0)
    # Attempt to create duplicate EvaluationQuestion for same evaluation + same versioned question
    with pytest.raises(IntegrityError):
        EvaluationQuestionFactory.create(
            evaluation=eq.evaluation,
            question=eq.question,
            section=eq.section,
            order=1,
        )


def test_skill_answer_one_to_one_per_evaluation_question():
    eq = EvaluationQuestionFactory.create()
    SkillAnswerFactory.create(evaluation_question=eq, value=3)

    with pytest.raises(IntegrityError):
        SkillAnswerFactory.create(evaluation_question=eq, value=4)


def test_skill_answer_value_must_be_within_question_range():
    eq = EvaluationQuestionFactory.create()
    q = eq.question
    assert q.min_score <= q.max_score

    # value too low
    a = SkillAnswerFactory.create(evaluation_question=eq, value=q.min_score - 1)
    with pytest.raises(ValidationError):
        a.full_clean()

    # value too high
    a2 = SkillAnswerFactory.create(evaluation_question=eq, value=q.max_score + 1)
    with pytest.raises(ValidationError):
        a2.full_clean()


def test_section_assignment_unique_per_eval_section():
    assign = EvaluationSectionAssignmentFactory.create()
    with pytest.raises(IntegrityError):
        EvaluationSectionAssignmentFactory.create(
            evaluation=assign.evaluation,
            section=assign.section,
            assigned_to=assign.assigned_to,
        )


def test_comment_visibility_flag_persists():
    c = EvaluationCommentFactory.create(
        is_visible_to_subject=True, text="Visible comment"
    )
    assert c.is_visible_to_subject is True
    assert c.text == "Visible comment"
