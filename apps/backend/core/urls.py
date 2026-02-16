from django.urls import path, include

urlpatterns = [
    path("auth/", include("users.routes.login")),
    path("auth/", include("users.routes.me")),
    path("api/test/", include("users.routes.permissions_demo")),
    path("api/", include("candidates.routes")),
]
