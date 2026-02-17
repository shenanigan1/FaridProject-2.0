from rest_framework.viewsets import ModelViewSet
from positions.models import Position
from positions.serializers import PositionSerializer

class PositionViewSet(ModelViewSet):
    queryset = Position.objects.all()
    serializer_class = PositionSerializer
