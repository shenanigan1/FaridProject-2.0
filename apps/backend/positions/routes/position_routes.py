from rest_framework.routers import DefaultRouter
from positions.views import PositionViewSet

router = DefaultRouter()
router.register("positions", PositionViewSet, basename="positions")

urlpatterns = router.urls
