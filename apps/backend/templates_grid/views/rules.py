from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from templates_grid.models import TemplatePoolRule
from templates_grid.serializers import TemplatePoolRuleSerializer
from users.permissions import IsHrAdminOrDirector


class TemplatePoolRuleViewSet(ModelViewSet):
    queryset = (
        TemplatePoolRule.objects.select_related("template", "section", "pool")
        .all()
        .order_by("template_id", "order", "id")
    )
    serializer_class = TemplatePoolRuleSerializer

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [IsAuthenticated(), IsHrAdminOrDirector()]
        return [IsAuthenticated()]
