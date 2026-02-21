import pytest
from django.contrib.auth import get_user_model

User = get_user_model()

@pytest.mark.django_db
def test_create_user_without_password_sets_unusable_password():
    user = User.objects.create_user(email="nopass@example.com")
    assert user.has_usable_password() is False
 
@pytest.mark.django_db   
def test_create_superuser_requires_staff_and_superuser_flags():
    user = User.objects.create_superuser(email="admin@example.com", password="secret")
    assert user.is_staff is True
    assert user.is_superuser is True