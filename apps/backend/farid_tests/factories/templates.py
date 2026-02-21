import factory
from templates_grid.models import (
    Template, QuestionPool, SkillQuestion, TemplatePool,
    TemplateVersion, VersionedPool, VersionedQuestion
)


class TemplateFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Template

    name = factory.Sequence(lambda n: f"Template {n}")
    status = "draft"


class QuestionPoolFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = QuestionPool

    name = factory.Sequence(lambda n: f"Pool {n}")
    code = factory.Sequence(lambda n: f"pool_{n}")
    description = "Pool description"


class SkillQuestionFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = SkillQuestion

    pool = factory.SubFactory(QuestionPoolFactory)
    label = factory.Sequence(lambda n: f"Question {n}")
    type = "soft"
    min_score = 0
    max_score = 5
    weight = 1
    is_active = True


class TemplatePoolFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = TemplatePool

    template = factory.SubFactory(TemplateFactory)
    pool = factory.SubFactory(QuestionPoolFactory)
    order = 0


class TemplateVersionFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = TemplateVersion

    template = factory.SubFactory(TemplateFactory)
    version = 1


class VersionedPoolFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = VersionedPool

    template_version = factory.SubFactory(TemplateVersionFactory)
    name = factory.Sequence(lambda n: f"VPool {n}")
    code = factory.Sequence(lambda n: f"vpool_{n}")
    description = "Snapshot pool"
    order = 0


class VersionedQuestionFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = VersionedQuestion

    versioned_pool = factory.SubFactory(VersionedPoolFactory)
    label = factory.Sequence(lambda n: f"VQuestion {n}")
    type = "soft"
    min_score = 0
    max_score = 5
    weight = 1
    order = 0