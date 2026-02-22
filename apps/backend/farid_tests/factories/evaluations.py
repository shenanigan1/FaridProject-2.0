# farid_tests/factories/evaluations.py
from __future__ import annotations

from dataclasses import dataclass

from users.models import User
from evaluations.models.evaluation import Evaluation
from evaluations.models.evaluation_question import EvaluationQuestion
from evaluations.models.skill_answer import SkillAnswer
from evaluations.models.evaluation_section_assignment import EvaluationSectionAssignment
from evaluations.models.evaluation_comment import EvaluationComment

from farid_tests.factories.users import UserFactory
from farid_tests.factories.positions import PositionFactory
from farid_tests.factories.recruitment import JobApplicationFactory
from farid_tests.factories.templates_grid import (
    TemplateFactory,
    TemplateVersionFactory,
    VersionedSectionFactory,
    VersionedPoolFactory,
    VersionedQuestionFactory,
)


@dataclass(frozen=True)
class EvaluationFactory:
    @staticmethod
    def create(
        *,
        subject: User | None = None,
        template_version=None,
        position=None,
        application=None,
        assigned_to: User | None = None,
        status: str = "in_progress",
        subject_comment: str = "",
        internal_comment: str = "",
    ) -> Evaluation:
        subject = subject or UserFactory.create(email="subject@example.com", password=None)
        template_version = template_version or TemplateVersionFactory.create(template=TemplateFactory.create(), version=1)
        position = position  # optional
        application = application  # optional
        assigned_to = assigned_to  # optional

        return Evaluation.objects.create(
            subject=subject,
            application=application,
            position=position,
            template_version=template_version,
            assigned_to=assigned_to,
            status=status,
            subject_comment=subject_comment,
            internal_comment=internal_comment,
        )


@dataclass(frozen=True)
class EvaluationQuestionFactory:
    @staticmethod
    def create(
        *,
        evaluation: Evaluation | None = None,
        question=None,
        section=None,
        is_mandatory: bool = False,
        order: int = 0,
    ) -> EvaluationQuestion:
        evaluation = evaluation or EvaluationFactory.create()

        if section is None:
            # Ensure section belongs to same template_version
            section = VersionedSectionFactory.create(template_version=evaluation.template_version, name="Section", order=0)

        if question is None:
            pool = VersionedPoolFactory.create(
                template_version=evaluation.template_version,
                section=section,
                name="Pool",
                code="pool",
                random_count=0,
                order=0,
            )
            question = VersionedQuestionFactory.create(
                pool=pool,
                label="Question",
                type="soft",
                is_mandatory=is_mandatory,
                min_score=0,
                max_score=5,
                order=order,
            )

        return EvaluationQuestion.objects.create(
            evaluation=evaluation,
            question=question,
            section=section,
            is_mandatory=is_mandatory,
            order=order,
        )


@dataclass(frozen=True)
class SkillAnswerFactory:
    @staticmethod
    def create(
        *,
        evaluation_question: EvaluationQuestion,
        value: int,
        persist: bool = True,
    ) -> SkillAnswer:
        obj = SkillAnswer(evaluation_question=evaluation_question, value=value)

        # ✅ If value is invalid, do NOT save, so tests can assert full_clean()
        q = evaluation_question.question
        if value < q.min_score or value > q.max_score:
            return obj

        if persist:
            obj.save()

        return obj


@dataclass(frozen=True)
class EvaluationSectionAssignmentFactory:
    @staticmethod
    def create(
        *,
        evaluation: Evaluation | None = None,
        section=None,
        assigned_to: User | None = None,
    ) -> EvaluationSectionAssignment:
        evaluation = evaluation or EvaluationFactory.create()

        if section is None:
            section = VersionedSectionFactory.create(template_version=evaluation.template_version, name="Section", order=0)

        assigned_to = assigned_to or UserFactory.create(email="manager@example.com", password=None)

        return EvaluationSectionAssignment.objects.create(
            evaluation=evaluation,
            section=section,
            assigned_to=assigned_to,
        )


@dataclass(frozen=True)
class EvaluationCommentFactory:
    @staticmethod
    def create(
        *,
        evaluation: Evaluation | None = None,
        author: User | None = None,
        text: str = "Good job",
        is_visible_to_subject: bool = False,
    ) -> EvaluationComment:
        evaluation = evaluation or EvaluationFactory.create()
        author = author or UserFactory.create(email="author@example.com", password=None)

        return EvaluationComment.objects.create(
            evaluation=evaluation,
            author=author,
            text=text,
            is_visible_to_subject=is_visible_to_subject,
        )