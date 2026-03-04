# farid_tests/unit/test_position_model.py
import pytest
from django.db.models.deletion import ProtectedError

from farid_tests.factories.companies import CompanyFactory
from farid_tests.factories.positions import PositionFactory

pytestmark = pytest.mark.django_db


def test_position_str_returns_title():
    pos = PositionFactory.create(title="Truck Driver")
    assert str(pos) == "Truck Driver"


def test_company_delete_is_protected_when_positions_exist():
    company = CompanyFactory.create(name="ProtectedCo")
    PositionFactory.create(company=company, title="Driver")

    with pytest.raises(ProtectedError):
        company.delete()
