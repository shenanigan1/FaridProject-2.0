# farid_tests/factories/recruitment.py
from __future__ import annotations

from dataclasses import dataclass

from recruitment.models.job_application import JobApplication
from farid_tests.factories.candidates import CandidateFactory
from farid_tests.factories.positions import PositionFactory


@dataclass(frozen=True)
class JobApplicationFactory:
    @staticmethod
    def create(
        *,
        candidate=None,
        position=None,
        status: str = "applied",
        assigned_template=None,
    ) -> JobApplication:
        candidate = candidate or CandidateFactory.create()
        position = position or PositionFactory.create()
        return JobApplication.objects.create(
            candidate=candidate,
            position=position,
            status=status,
            assigned_template=assigned_template,
        )
