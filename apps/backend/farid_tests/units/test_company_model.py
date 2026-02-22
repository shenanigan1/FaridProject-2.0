# farid_tests/unit/test_company_model.py
import pytest
from django.db import IntegrityError

from companies.models import Company

pytestmark = pytest.mark.django_db


def test_company_str_returns_name():
    company = Company.objects.create(name="ACME")
    assert str(company) == "ACME"


def test_company_name_is_unique():
    Company.objects.create(name="UniqueCo")

    with pytest.raises(IntegrityError):
        Company.objects.create(name="UniqueCo")