import pytest
from django.db import IntegrityError
from farid_tests.factories.templates import TemplateFactory, TemplateVersionFactory


@pytest.mark.django_db
def test_template_version_unique_per_template_version_number():
    tpl = TemplateFactory(status="published")
    TemplateVersionFactory(template=tpl, version=1)

    with pytest.raises(IntegrityError):
        TemplateVersionFactory(template=tpl, version=1)