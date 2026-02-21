import pytest
from farid_tests.factories.positions import PositionFactory


@pytest.mark.django_db
def test_position_str():
    pos = PositionFactory(title="Backend Developer")
    assert str(pos) == "Backend Developer"