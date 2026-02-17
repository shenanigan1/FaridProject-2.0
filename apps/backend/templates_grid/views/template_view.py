from rest_framework.viewsets import ModelViewSet
from templates_grid.models import Template
from templates_grid.serializers import TemplateSerializer

class TemplateViewSet(ModelViewSet):
    queryset = Template.objects.all()
    serializer_class = TemplateSerializer
