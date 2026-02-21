import pytest
from django.db import IntegrityError
from templates_grid.models import QuestionPool, TemplatePool
from farid_tests.factories.templates import TemplateFactory, QuestionPoolFactory


@pytest.mark.django_db
def test_question_pool_code_unique():
    QuestionPoolFactory(code="soft_pool")
    with pytest.raises(IntegrityError):
        QuestionPoolFactory(code="soft_pool")


@pytest.mark.django_db
def test_template_pool_unique_pool_per_template():
    tpl = TemplateFactory()
    pool = QuestionPoolFactory()
    TemplatePool.objects.create(template=tpl, pool=pool, order=0)

    with pytest.raises(IntegrityError):
        TemplatePool.objects.create(template=tpl, pool=pool, order=1)