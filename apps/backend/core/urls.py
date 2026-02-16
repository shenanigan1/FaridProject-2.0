from django.urls import path, include

urlpatterns = [
    path("auth/", include("users.routes.login")),
    path("auth/", include("users.routes.me")),
]
