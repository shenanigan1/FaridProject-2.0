from turtle import position
from urllib import request
from django import template
from rest_framework.decorators import action
from rest_framework.response import Response 
from rest_framework import status
from rest_framework.viewsets import ModelViewSet

from positions.models import Position
from positions.serializers import PositionSerializer
from templates_grid.models import Template

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
        grid_id = request.data.get("grid_id")  # <-- FIX

        if not grid_id:
            return Response(
                {"grid_id": ["This field is required."]},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            template = Template.objects.get(id=grid_id)
        except Template.DoesNotExist:
           return Response(
               {"grid_id": ["Template not found."]},
               status=status.HTTP_404_NOT_FOUND
        )

        position.templates.add(template)

        return Response(
            {"status": "template associated"},
            status=status.HTTP_200_OK
        )

