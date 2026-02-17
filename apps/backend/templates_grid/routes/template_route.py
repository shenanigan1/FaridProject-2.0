from rest_framework.routers import DefaultRouter
from templates_grid.views import TemplateViewSet

router = DefaultRouter()
router.register("templates", TemplateViewSet, basename="templates")

urlpatterns = router.urls
