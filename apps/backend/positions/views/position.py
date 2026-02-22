from rest_framework.viewsets import ModelViewSet
from positions.models import Position
from positions.serializers import PositionSerializer


class PositionViewSet(ModelViewSet):
    queryset = Position.objects.select_related("company").all().order_by("id")
    serializer_class = PositionSerializer