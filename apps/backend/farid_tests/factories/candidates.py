# farid_tests/factories/candidates.py
from __future__ import annotations

from dataclasses import dataclass
from typing import Optional
import uuid

from candidates.models import Candidate
from farid_tests.factories.users import UserFactory


@dataclass(frozen=True)
class CandidateFactory:
    @staticmethod
    def create(
        *,
        user=None,
        email: Optional[str] = None,
        first_name: str = "Jean",
        last_name: str = "Dupont",
        phone: str = "",
        flag: bool = False,
        target_position=None,
    ) -> Candidate:
        if user is None:
            if email is None:
                email = f"candidate-{uuid.uuid4().hex[:10]}@example.com"
            user = UserFactory.create(
                email=email,
                first_name=first_name,
                last_name=last_name,
                phone=phone,
                password=None,
            )

        return Candidate.objects.create(
            user=user,
            flag=flag,
            target_position=target_position,
        )