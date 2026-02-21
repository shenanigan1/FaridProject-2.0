from rest_framework.routers import DefaultRouter
from evaluations.views.evaluation_view import EvaluationViewSet

router = DefaultRouter()
router.register(r"evaluations", EvaluationViewSet, basename="evaluations")

urlpatterns = router.urls
