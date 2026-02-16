import pytest
from users.models import User, Person, UserRoles
from django.contrib.auth.hashers import check_password

@pytest.mark.django_db
def test_create_user_with_role_and_person():
    person = Person.objects.create(first_name="John", last_name="Doe")

    user = User.objects.create_user(
        email="john@doe.com",
        password="password123",
        role=UserRoles.HR,
        person=person
    )

    assert user.email == "john@doe.com"
    assert user.role == UserRoles.HR
    assert user.person == person
    assert check_password("password123", user.password)
    assert user.is_active is True
