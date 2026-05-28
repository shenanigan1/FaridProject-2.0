from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from templates_grid.models import SkillQuestion
from templates_grid.serializers import SkillQuestionSerializer
from users.permissions import IsHrAdminOrDirector


class SkillQuestionViewSet(ModelViewSet):
    queryset = (
        SkillQuestion.objects.select_related("pool")
        .all()
        .order_by("pool_id", "order", "id")
    )
    serializer_class = SkillQuestionSerializer

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [IsAuthenticated(), IsHrAdminOrDirector()]
        return [IsAuthenticated()]
