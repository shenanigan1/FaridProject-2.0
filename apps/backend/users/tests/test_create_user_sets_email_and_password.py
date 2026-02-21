import pytest
from django.contrib.auth import get_user_model

User = get_user_model()


@pytest.mark.django_db
def test_create_user_sets_email_and_password():
    user = User.objects.create_user(email="test@example.com", password="secret")
    assert user.email == "test@example.com"
    assert user.check_password("secret") is True
