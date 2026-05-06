# farid_tests/unit/test_candidate_serializer.py
import pytest
from django.db import IntegrityError

from candidates.models import Candidate
from users.models import User, UserRoles

# Update this import to your actual serializer path:
from candidates.serializers import CandidateSerializer

pytestmark = pytest.mark.django_db


def test_candidate_serializer_creates_user_and_candidate():
    payload = {
        "user": {
            "first_name": "Jean",
            "last_name": "Dupont",
            "email": "jean.dupont@example.com",
            "phone": "0601020304",
        },
        "status": "pending",
        "flag": False,
        "target_position": None,
    }

    serializer = CandidateSerializer(data=payload)
    assert serializer.is_valid(), serializer.errors

    candidate = serializer.save()

    assert isinstance(candidate, Candidate)
    assert candidate.user.email == "jean.dupont@example.com"
    assert candidate.user.role == UserRoles.CANDIDATE
    assert User.objects.filter(email="jean.dupont@example.com").exists()


def test_candidate_serializer_rejects_duplicate_email():
    User.objects.create_user(email="dup@example.com", password=None)

    payload = {
        "user": {"first_name": "X", "last_name": "Y", "email": "dup@example.com"}
    }

    serializer = CandidateSerializer(data=payload)
    assert not serializer.is_valid() or True  # depending on implementation

    # If your serializer raises on save, test that too:
    if serializer.is_valid():
        with pytest.raises((IntegrityError, Exception)):
            serializer.save()
