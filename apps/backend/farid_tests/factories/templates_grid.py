# farid_tests/factories/templates_grid.py
from __future__ import annotations

from dataclasses import dataclass

from templates_grid.models.question_pool import QuestionPool
from templates_grid.models.skill_question import SkillQuestion, SkillType
from templates_grid.models.template import Template
from templates_grid.models.template_section import TemplateSection
from templates_grid.models.template_pool_rule import TemplatePoolRule

# If you already created versioning models:
from templates_grid.models.template_version import TemplateVersion
from templates_grid.models.versioned_section import VersionedSection
from templates_grid.models.versioned_pool import VersionedPool
from templates_grid.models.versioned_question import VersionedQuestion


@dataclass(frozen=True)
class QuestionPoolFactory:
    @staticmethod
    def create(
        *,
        name: str = "Soft Skills Pool",
        code: str = "soft_skills_pool",
        description: str = "",
    ) -> QuestionPool:
        return QuestionPool.objects.create(name=name, code=code, description=description)


@dataclass(frozen=True)
class SkillQuestionFactory:
    @staticmethod
    def create(
        *,
        pool: QuestionPool | None = None,
        label: str = "Communication",
        type: str = SkillType.SOFT,
        is_mandatory: bool = False,
        min_score: int = 0,
        max_score: int = 5,
        order: int = 0,
        persist: bool = True,
    ) -> SkillQuestion:
        pool = pool or QuestionPoolFactory.create()

        obj = SkillQuestion(
            pool=pool,
            label=label,
            type=type,
            is_mandatory=is_mandatory,
            min_score=min_score,
            max_score=max_score,
            order=order,
        )

        # ✅ If invalid, NEVER hit the DB constraint: return unsaved instance
        if min_score > max_score:
            return obj

        if persist:
            obj.save()

        return obj


@dataclass(frozen=True)
class TemplateFactory:
    @staticmethod
    def create(*, name: str = "Driver Template", is_active: bool = True) -> Template:
        return Template.objects.create(name=name, is_active=is_active)


@dataclass(frozen=True)
class TemplateSectionFactory:
    @staticmethod
    def create(
        *,
        template: Template | None = None,
        name: str = "Section A",
        order: int = 0,
    ) -> TemplateSection:
        template = template or TemplateFactory.create()
        return TemplateSection.objects.create(template=template, name=name, order=order)


@dataclass(frozen=True)
class TemplatePoolRuleFactory:
    @staticmethod
    def create(
        *,
        template: Template | None = None,
        section: TemplateSection | None = None,
        pool: QuestionPool | None = None,
        random_count: int = 0,
        order: int = 0,
    ) -> TemplatePoolRule:
        template = template or TemplateFactory.create()
        section = section or TemplateSectionFactory.create(template=template)
        pool = pool or QuestionPoolFactory.create()
        return TemplatePoolRule.objects.create(
            template=template,
            section=section,
            pool=pool,
            random_count=random_count,
            order=order,
        )


# ---- Versioning factories (if you created those models) ----

@dataclass(frozen=True)
class TemplateVersionFactory:
    @staticmethod
    def create(*, template: Template | None = None, version: int = 1) -> TemplateVersion:
        template = template or TemplateFactory.create()
        return TemplateVersion.objects.create(template=template, version=version)


@dataclass(frozen=True)
class VersionedSectionFactory:
    @staticmethod
    def create(*, template_version: TemplateVersion | None = None, name: str = "VSection", order: int = 0) -> VersionedSection:
        template_version = template_version or TemplateVersionFactory.create()
        return VersionedSection.objects.create(template_version=template_version, name=name, order=order)


@dataclass(frozen=True)
class VersionedPoolFactory:
    @staticmethod
    def create(
        *,
        template_version: TemplateVersion | None = None,
        section: VersionedSection | None = None,
        name: str = "VPool",
        code: str = "vpool",
        random_count: int = 0,
        order: int = 0,
    ) -> VersionedPool:
        template_version = template_version or TemplateVersionFactory.create()
        section = section or VersionedSectionFactory.create(template_version=template_version)
        return VersionedPool.objects.create(
            template_version=template_version,
            section=section,
            name=name,
            code=code,
            random_count=random_count,
            order=order,
        )


@dataclass(frozen=True)
class VersionedQuestionFactory:
    @staticmethod
    def create(
        *,
        pool: VersionedPool | None = None,
        label: str = "VQuestion",
        type: str = "soft",
        is_mandatory: bool = False,
        min_score: int = 0,
        max_score: int = 5,
        order: int = 0,
        persist: bool = True,
    ) -> VersionedQuestion:
        pool = pool or VersionedPoolFactory.create()

        obj = VersionedQuestion(
            pool=pool,
            label=label,
            type=type,
            is_mandatory=is_mandatory,
            min_score=min_score,
            max_score=max_score,
            order=order,
        )

        # ✅ Avoid DB CHECK constraint so unit tests can assert full_clean()
        if min_score > max_score:
            return obj

        if persist:
            obj.save()

        return obj