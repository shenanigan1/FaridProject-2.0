# farid_tests/factories/positions.py
from __future__ import annotations

from dataclasses import dataclass
from positions.models import Position
from farid_tests.factories import CompanyFactory


@dataclass(frozen=True)
class PositionFactory:
    @staticmethod
    def create(
        *,
        title: str = "Truck Driver",
        department: str = "Logistics",
        contract_type: str = "CDI",
        company=None,
        location: str = "",
        salary: int | None = None,
        is_active: bool = True,
    ) -> Position:
        company = company or CompanyFactory.create()
        return Position.objects.create(
            company=company,
            title=title,
            description="",
            department=department,
            contract_type=contract_type,
            location=location,
            salary=salary,
            is_active=is_active,
        )
