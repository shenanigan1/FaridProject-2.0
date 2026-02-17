import pytest
from users.models import User, UserRoles
from django.contrib.auth.hashers import check_password

@pytest.mark.django_db
def test_create_user_with_role():

    user = User.objects.create_user(
        email="john@doe.com",
        password="password123",
        role=UserRoles.HR,
    )

    assert user.email == "john@doe.com"
    assert user.role == UserRoles.HR
    assert check_password("password123", user.password)
    assert user.is_active is True
