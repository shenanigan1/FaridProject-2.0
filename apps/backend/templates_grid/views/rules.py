from rest_framework.viewsets import ModelViewSet
from templates_grid.models import TemplatePoolRule
from templates_grid.serializers import TemplatePoolRuleSerializer


class TemplatePoolRuleViewSet(ModelViewSet):
    queryset = (
        TemplatePoolRule.objects.select_related("template", "section", "pool")
        .all()
        .order_by("template_id", "order", "id")
    )
    serializer_class = TemplatePoolRuleSerializer
