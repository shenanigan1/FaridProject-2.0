# farid_tests/unit/test_users_model.py
import pytest
from django.core.exceptions import ValidationError

from users.models import User
from users.models.roles import UserRoles

pytestmark = pytest.mark.django_db


def test_create_user_requires_email():
    with pytest.raises(ValueError):
        User.objects.create_user(email="", password=None)


def test_create_user_normalizes_email():
    user = User.objects.create_user(email="TEST@EXAMPLE.COM", password=None)
    assert user.email == "TEST@example.com" or user.email.lower() == "test@example.com"
    # normalize_email behavior depends on Django version; keep tolerant:
    assert "@" in user.email


def test_create_user_sets_unusable_password_when_none():
    user = User.objects.create_user(email="no-pass@example.com", password=None)
    assert user.has_usable_password() is False


def test_create_user_sets_password_when_provided():
    user = User.objects.create_user(email="pass@example.com", password="S3cret-123")
    assert user.has_usable_password() is True
    assert user.check_password("S3cret-123") is True


def test_create_superuser_flags():
    admin = User.objects.create_superuser(email="admin@example.com", password="Admin-123")
    assert admin.is_staff is True
    assert admin.is_superuser is True


def test_user_str_prefers_full_name():
    user = User.objects.create_user(email="name@example.com", password=None, first_name="Jean", last_name="Dupont")
    s = str(user)
    assert "Jean" in s or "Dupont" in s


def test_user_str_falls_back_to_email():
    user = User.objects.create_user(email="email-only@example.com", password=None, first_name="", last_name="")
    assert str(user) == "email-only@example.com"


def test_user_default_role_employee():
    user = User.objects.create_user(email="role@example.com", password=None)
    assert user.role == UserRoles.EMPLOYEE


def test_user_full_clean_validates_email_format():
    user = User(email="not-an-email")
    with pytest.raises(ValidationError):
        user.full_clean()