from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from rest_framework.viewsets import ModelViewSet
from templates_grid.models import QuestionPool, SkillQuestion
from templates_grid.serializers import QuestionPoolSerializer, SkillQuestionSerializer


class QuestionPoolViewSet(ModelViewSet):
    queryset = QuestionPool.objects.all().order_by("id")
    serializer_class = QuestionPoolSerializer
    
    @action(detail=True, methods=["get", "post"], url_path="questions")
    def questions(self, request, pk=None):
        pool = self.get_object()
        
        print("RAW AUTH HEADER:", repr(request.META.get("HTTP_AUTHORIZATION")))

        if request.method == "GET":
            qs = SkillQuestion.objects.filter(pool=pool).order_by("order", "id")
            return Response(SkillQuestionSerializer(qs, many=True).data)

        serializer = SkillQuestionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(pool=pool)
        return Response(serializer.data, status=status.HTTP_201_CREATED)