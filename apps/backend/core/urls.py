from django.urls import path, include

from rest_framework.routers import DefaultRouter

from companies.views import CompanyViewSet
from positions.views import PositionViewSet, PublicPositionListView
from candidates.views import CandidateViewSet
from employees.views import EmployeeViewSet
from recruitment.views import JobApplicationViewSet

from templates_grid.views.pools import QuestionPoolViewSet
from templates_grid.views.questions import SkillQuestionViewSet
from templates_grid.views.templates import TemplateViewSet, TemplateSectionViewSet
from templates_grid.views.rules import TemplatePoolRuleViewSet

from evaluations.views import EvaluationViewSet

router = DefaultRouter()
router.register("companies", CompanyViewSet, basename="companies")
router.register("positions", PositionViewSet, basename="positions")
router.register("candidates", CandidateViewSet, basename="candidates")
router.register("employees", EmployeeViewSet, basename="employees")
router.register("jobapplications", JobApplicationViewSet, basename="jobapplications")

router.register("questionpools", QuestionPoolViewSet, basename="questionpools")
router.register("skillquestions", SkillQuestionViewSet, basename="skillquestions")
router.register("templates", TemplateViewSet, basename="templates")
router.register("templatesections", TemplateSectionViewSet, basename="templatesections")
router.register(
    "templatepoolrules", TemplatePoolRuleViewSet, basename="templatepoolrules"
)

router.register("evaluations", EvaluationViewSet, basename="evaluations")

urlpatterns = [
    path("api/", include(router.urls)),
    path("api/auth/", include("users.routes.auth")),
    path("api/public/positions/", PublicPositionListView.as_view()),
    # Keep auth include only if it exists and does not break imports:
    # path("auth/", include("users.routes.login")),
]
