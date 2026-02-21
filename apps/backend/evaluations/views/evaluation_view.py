from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from rest_framework.viewsets import ModelViewSet

from evaluations.models import Evaluation
from evaluations.serializers.start_evaluation_serializer import StartEvaluationSerializer
from evaluations.serializers.evaluation_serializer import EvaluationSerializer
from templates_grid.models import SkillQuestion, SkillType
from evaluations.models import SkillAnswer
from evaluations.serializers import SkillAnswerSerializer


class EvaluationViewSet(ModelViewSet):
    queryset = Evaluation.objects.all()

    def create(self, request, *args, **kwargs): 
        serializer = StartEvaluationSerializer(data=request.data) 
        serializer.is_valid(raise_exception=True) 
        evaluation = serializer.save() 
        return Response( {"id": evaluation.id}, status=status.HTTP_201_CREATED)


    def _save_skill_answers(self, evaluation, answers, skill_type):
        for answer in answers:
            question = SkillQuestion.objects.get(id=answer["question_id"])

            if question.type != skill_type:
                raise ValueError("Question type mismatch.")

            SkillAnswer.objects.create(
                evaluation=evaluation,
                question=question,
                value=answer["value"]
            )

    @action(detail=True, methods=["post"], url_path="soft-skills")
    def soft_skills(self, request, pk=None):
        evaluation = self.get_object()
        serializer = SkillAnswerSerializer(data=request.data.get("answers", []), many=True)
        serializer.is_valid(raise_exception=True)

        self._save_skill_answers(evaluation, serializer.validated_data, SkillType.SOFT)

        return Response({"status": "soft skills saved"}, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], url_path="hard-skills")
    def hard_skills(self, request, pk=None):
        evaluation = self.get_object()
        serializer = SkillAnswerSerializer(data=request.data.get("answers", []), many=True)
        serializer.is_valid(raise_exception=True)

        self._save_skill_answers(evaluation, serializer.validated_data, SkillType.HARD)

        return Response({"status": "hard skills saved"}, status=status.HTTP_200_OK)
    
    # POST /api/evaluations/start/
    @action(detail=False, methods=["post"], url_path="start")
    def start(self, request):
        return self.create(request)
    
    # POST /api/evaluations/<id>/validate/
    @action(detail=True, methods=["post"], url_path="validate")
    def validate(self, request, pk=None):
        evaluation = self.get_object()
        evaluation.status = "validated"
        evaluation.save()
        return Response({"status": "validated"}, status=200)

    # GET /api/evaluations/pending/
    @action(detail=False, methods=["get"], url_path="pending")
    def pending(self, request):
        evaluations = Evaluation.objects.exclude(status="validated")
        serializer = EvaluationSerializer(evaluations, many=True)
        return Response(serializer.data, status=200)

    # GET /api/evaluations/completed/
    @action(detail=False, methods=["get"], url_path="completed")
    def completed(self, request):
        evaluations = Evaluation.objects.filter(status="validated")
        serializer = EvaluationSerializer(evaluations, many=True)
        return Response(serializer.data, status=200)

    # GET /api/evaluations/<id>/history/
    @action(detail=True, methods=["get"], url_path="history")
    def history(self, request, pk=None):
        evaluations = Evaluation.objects.filter(candidate_id=pk).order_by("created_at")
        serializer = EvaluationSerializer(evaluations, many=True)
        return Response(serializer.data, status=200)
    
    @action(detail=True, methods=["post"], url_path="valider")
    def valider(self, request, pk=None):
        evaluation = self.get_object()

        # Vérification permissions RH / Direction
        user = request.user
        if user.role not in ["HR", "DIRECTION"]:
            return Response(
                {"detail": "Permission denied."},
                status=status.HTTP_403_FORBIDDEN
            )

        # Mise à jour du statut
        evaluation.status = "validated"
        evaluation.save()

        return Response({"status": "validated"}, status=status.HTTP_200_OK)


