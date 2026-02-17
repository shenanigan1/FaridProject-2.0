from django.urls import path, include

urlpatterns = [
    path("auth/", include("users.routes.login")),
    path("auth/", include("users.routes.me")),
    path("test/", include("users.routes.permissions_demo")),
    path("", include("candidates.routes")),
    path("", include("positions.routes")),
    path("", include("templates_grid.routes")),
    path("", include("users.routes")),
]
