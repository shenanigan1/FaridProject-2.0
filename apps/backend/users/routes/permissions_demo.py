from django.urls import path
from users.views.permissions_demo import AdminOnlyView, HROnlyView

urlpatterns = [
    path("admin-only/", AdminOnlyView.as_view(), name="admin-only-endpoint"),
    path("hr-only/", HROnlyView.as_view(), name="hr-only-endpoint"),
]
