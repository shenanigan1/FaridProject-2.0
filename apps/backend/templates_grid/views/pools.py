from django.db import models
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from rest_framework.viewsets import ModelViewSet


from templates_grid.models import QuestionPool, SkillQuestion
from templates_grid.serializers import QuestionPoolSerializer, SkillQuestionSerializer


class QuestionPoolViewSet(ModelViewSet):
    queryset = QuestionPool.objects.all().order_by("id")
    serializer_class = QuestionPoolSerializer

    search_fields = ["name", "code"]

    @action(detail=True, methods=["get", "post"], url_path="questions")
    def questions(self, request, pk=None):
        pool = self.get_object()

        # -------------------------
        # GET → list questions
        # -------------------------
        if request.method == "GET":
            qs = SkillQuestion.objects.filter(pool=pool).order_by("order", "id")
            serializer = SkillQuestionSerializer(qs, many=True)
            return Response(serializer.data)

        # -------------------------
        # POST → create question
        # -------------------------
        if request.method == "POST":
            # Compute next order safely
            max_order = (
                SkillQuestion.objects.filter(pool=pool)
                .aggregate(models.Max("order"))
                .get("order__max")
            ) or 0

            # IMPORTANT: never mutate request.data directly
            data = request.data.copy()
            data["order"] = max_order + 1

            serializer = SkillQuestionSerializer(data=data)
            serializer.is_valid(raise_exception=True)
            serializer.save(pool=pool)

            return Response(serializer.data, status=status.HTTP_201_CREATED)
