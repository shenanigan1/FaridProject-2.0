from rest_framework.viewsets import ModelViewSet

from templates_grid.models.template import Template
from templates_grid.models.template_section import TemplateSection

from templates_grid.serializers import ( TemplateSerializer,TemplateSectionSerializer, TemplateEditorSerializer)

class TemplateViewSet(ModelViewSet):
    queryset = Template.objects.all()

    def get_serializer_class(self):
        # list can stay lightweight
        if self.action == "list":
            return TemplateSerializer

        # retrieve/create/update should return full editor payload (with sections)
        return TemplateEditorSerializer


class TemplateSectionViewSet(ModelViewSet):
    queryset = TemplateSection.objects.select_related("template").all().order_by("template_id", "order", "id")
    serializer_class = TemplateSectionSerializer


