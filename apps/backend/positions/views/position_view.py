from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from positions.models import Position
from positions.serializers import PositionSerializer
from positions.services import associate_template_to_position

class PositionViewSet(ModelViewSet):
    queryset = Position.objects.all()
    serializer_class = PositionSerializer
    
    # Action for associating a template_grid to a position
    @action(
    detail=True,
    methods=["post"],
    url_path="associer-grille",
    url_name="associate-template"
    )
    def associate_template(self, request, pk=None):
        position = self.get_object()
        result = associate_template_to_position(
            position=position,
            template_id=request.data.get("template_id"),
        )

        return Response(result.payload, status=result.status_code)

