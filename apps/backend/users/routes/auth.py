from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from users.views.auth import LoginView, MeView, RegisterView

urlpatterns = [
    path("register/", RegisterView.as_view(), name="auth-register"),
    path("login/", LoginView.as_view(), name="auth-login"),
    path("me/", MeView.as_view(), name="auth-me"),
    path("refresh/", TokenRefreshView.as_view(), name="auth-refresh"),
]
