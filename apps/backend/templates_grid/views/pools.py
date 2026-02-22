from rest_framework.viewsets import ModelViewSet
from templates_grid.models import QuestionPool
from templates_grid.serializers import QuestionPoolSerializer

class QuestionPoolViewSet(ModelViewSet):
    queryset = QuestionPool.objects.all().order_by("id")
    serializer_class = QuestionPoolSerializer
