import pytest
from farid_tests.factories.candidates import CandidateFactory


@pytest.mark.django_db
def test_candidate_str():
    c = CandidateFactory(first_name="Alice", last_name="Smith")
    assert str(c) == "Alice Smith"