from rest_framework.routers import DefaultRouter
from candidates.views import CandidateViewSet

router = DefaultRouter()
router.register(r"candidates", CandidateViewSet, basename="candidates")

urlpatterns = router.urls
