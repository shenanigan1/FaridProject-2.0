from rest_framework.viewsets import ModelViewSet
from templates_grid.models import SkillQuestion
from templates_grid.serializers import SkillQuestionSerializer

class SkillQuestionViewSet(ModelViewSet):
    queryset = SkillQuestion.objects.select_related("pool").all().order_by("pool_id", "order", "id")
    serializer_class = SkillQuestionSerializer

    