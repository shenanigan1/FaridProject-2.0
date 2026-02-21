import factory
from evaluations.models import Evaluation, SkillAnswer
from farid_tests.factories.candidates import CandidateFactory
from farid_tests.factories.positions import PositionFactory
from farid_tests.factories.users import UserFactory
from farid_tests.factories.templates import TemplateVersionFactory, VersionedQuestionFactory


class EvaluationFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Evaluation

    candidate = factory.SubFactory(CandidateFactory)
    employee = None
    position = factory.SubFactory(PositionFactory)
    template_version = factory.SubFactory(TemplateVersionFactory)
    assigned_to = factory.SubFactory(UserFactory)
    status = "draft"


class SkillAnswerFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = SkillAnswer

    evaluation = factory.SubFactory(EvaluationFactory)
    question = factory.SubFactory(VersionedQuestionFactory)
    value = 3
    comment = ""