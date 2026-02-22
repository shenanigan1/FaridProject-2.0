from rest_framework.viewsets import ModelViewSet

from templates_grid.models.template import Template
from templates_grid.models.template_section import TemplateSection

from templates_grid.serializers import ( TemplateSerializer,TemplateSectionSerializer)

class TemplateViewSet(ModelViewSet):
    queryset = Template.objects.all().order_by("id")
    serializer_class = TemplateSerializer


class TemplateSectionViewSet(ModelViewSet):
    queryset = TemplateSection.objects.select_related("template").all().order_by("template_id", "order", "id")
    serializer_class = TemplateSectionSerializer


