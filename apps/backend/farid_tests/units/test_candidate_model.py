# farid_tests/unit/test_candidate_model.py
import pytest
from farid_tests.factories.candidates import CandidateFactory
from farid_tests.factories.positions import PositionFactory

pytestmark = pytest.mark.django_db


def test_candidate_str_uses_user_identity():
    candidate = CandidateFactory.create(
        first_name="Jean", last_name="Dupont", email="jd@example.com"
    )
    assert "Candidate:" in str(candidate)
    assert "Jean" in str(candidate) or "jd@example.com" in str(candidate)


def test_candidate_can_have_target_position():
    pos = PositionFactory.create(title="Driver")
    candidate = CandidateFactory.create(target_position=pos)
    candidate.refresh_from_db()
    assert candidate.target_position_id == pos.id
