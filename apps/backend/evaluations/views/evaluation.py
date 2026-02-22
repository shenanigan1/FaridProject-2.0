from rest_framework.viewsets import ModelViewSet
from evaluations.models.evaluation import Evaluation
from evaluations.serializers import EvaluationSerializer


class EvaluationViewSet(ModelViewSet):
    queryset = Evaluation.objects.select_related(
        "subject", "application", "position", "template_version", "assigned_to"
    ).all().order_by("id")
    serializer_class = EvaluationSerializer