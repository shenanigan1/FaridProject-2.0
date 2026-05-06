# farid_tests/factories/users.py
from __future__ import annotations

from dataclasses import dataclass
from typing import Optional
import uuid

from users.models import User


@dataclass(frozen=True)
class UserFactory:
    @staticmethod
    def create(
        *,
        email: Optional[str] = None,
        first_name: str = "John",
        last_name: str = "Doe",
        phone: str = "",
        password: Optional[str] = None,
        role: Optional[str] = None,
        is_staff: bool = False,
        is_active: bool = True,
    ) -> User:
        # ✅ Generate unique email if none provided
        if email is None:
            email = f"user-{uuid.uuid4().hex[:10]}@example.com"

        kwargs = {
            "first_name": first_name,
            "last_name": last_name,
            "phone": phone,
            "is_staff": is_staff,
            "is_active": is_active,
        }

        if role is not None:
            kwargs["role"] = role

        return User.objects.create_user(email=email, password=password, **kwargs)
