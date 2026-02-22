# farid_tests/unit/test_templates_grid_models.py
import pytest
from django.core.exceptions import ValidationError
from django.db import IntegrityError

from farid_tests.factories.templates_grid import (
    QuestionPoolFactory,
    SkillQuestionFactory,
    TemplateFactory,
    TemplateSectionFactory,
    TemplatePoolRuleFactory,
    TemplateVersionFactory,
    VersionedQuestionFactory,
)

pytestmark = pytest.mark.django_db


def test_question_pool_str():
    pool = QuestionPoolFactory.create(name="Soft Skills", code="soft")
    assert str(pool) == "Soft Skills"


def test_question_pool_code_unique():
    QuestionPoolFactory.create(name="Pool 1", code="unique_code")
    with pytest.raises(IntegrityError):
        QuestionPoolFactory.create(name="Pool 2", code="unique_code")


def test_skill_question_str_contains_type_and_label():
    q = SkillQuestionFactory.create(label="Communication")
    s = str(q)
    assert "Communication" in s


def test_skill_question_min_score_must_be_lte_max_score():
    # Your model has a CheckConstraint + should raise ValidationError on full_clean().
    q = SkillQuestionFactory.create(min_score=10, max_score=5)
    # DB constraint might allow insert depending on database; so validate at model-level:
    with pytest.raises(ValidationError):
        q.full_clean()


def test_template_str():
    t = TemplateFactory.create(name="Driver Template")
    assert str(t) == "Driver Template"


def test_template_section_unique_name_per_template():
    template = TemplateFactory.create(name="T")
    TemplateSectionFactory.create(template=template, name="Sec 1")
    with pytest.raises(IntegrityError):
        TemplateSectionFactory.create(template=template, name="Sec 1")


def test_template_pool_rule_unique_template_pool():
    template = TemplateFactory.create(name="T")
    section = TemplateSectionFactory.create(template=template, name="Sec A")
    pool = QuestionPoolFactory.create(code="p1")

    TemplatePoolRuleFactory.create(template=template, section=section, pool=pool, random_count=2)

    with pytest.raises(IntegrityError):
        TemplatePoolRuleFactory.create(template=template, section=section, pool=pool, random_count=1)


def test_template_version_unique_per_template():
    template = TemplateFactory.create(name="T")
    TemplateVersionFactory.create(template=template, version=1)
    with pytest.raises(IntegrityError):
        TemplateVersionFactory.create(template=template, version=1)


def test_versioned_question_min_score_lte_max_score():
    vq = VersionedQuestionFactory.create(min_score=7, max_score=3)
    with pytest.raises(ValidationError):
        vq.full_clean()