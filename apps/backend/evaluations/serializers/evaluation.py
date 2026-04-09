from rest_framework import serializers
from evaluations.models import Evaluation
from candidates.models import Candidate
from templates_grid.models import Template
from templates_grid.models import TemplateVersion
from users.models import User
from recruitment.models import JobApplication
from positions.models import PositionTestTemplateAssignment
from templates_grid.models import SkillQuestion
from evaluations.models import EvaluationResponse


class EvaluationSerializer(serializers.ModelSerializer):
    template_name = serializers.CharField(source="template_version.template.name", read_only=True)

    class Meta:
        model = Evaluation
        fields = [
            "id",
            "subject",
            "application",
            "position",
            "template_version",
            "assigned_to",
            "status",
            "subject_comment",
            "internal_comment",
            "template_name",
            "created_at",
            "updated_at",
            "completed_at",
            "validated_at",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
            "completed_at",
            "validated_at",
        ]


class SubjectEvaluationSerializer(serializers.ModelSerializer):
    template_name = serializers.CharField(source="template_version.template.name", read_only=True)

    class Meta:
        model = Evaluation
        fields = [
            "id",
            "subject",
            "application",
            "position",
            "template_version",
            "assigned_to",
            "status",
            "subject_comment",
            "template_name",
            "created_at",
            "updated_at",
            "completed_at",
            "validated_at",
        ]
        read_only_fields = fields


class StartEvaluationSerializer(serializers.Serializer):
    candidate_id = serializers.IntegerField(required=True)
    grid_id = serializers.IntegerField(required=True)
    evaluator_id = serializers.IntegerField(required=True)

    def validate(self, data):
        # Vérifier existence des objets
        try:
            data["candidate"] = Candidate.objects.get(id=data["candidate_id"])
        except Candidate.DoesNotExist:
            raise serializers.ValidationError({"candidate_id": "Invalid candidate_id"})

        try:
            data["template"] = Template.objects.get(id=data["grid_id"])
        except Template.DoesNotExist:
            raise serializers.ValidationError({"grid_id": "Invalid grid_id"})

        try:
            data["evaluator"] = User.objects.get(id=data["evaluator_id"])
        except User.DoesNotExist:
            raise serializers.ValidationError({"evaluator_id": "Invalid evaluator_id"})

        return data

    def create(self, validated_data):
        return Evaluation.objects.create(
            candidate=validated_data["candidate"],
            template=validated_data["template"],
            assigned_to=validated_data["evaluator"],
            status="in_progress",
        )


class LaunchEvaluationSerializer(serializers.Serializer):
    application_id = serializers.IntegerField(required=True)
    template_id = serializers.IntegerField(required=False)
    assigned_to_id = serializers.IntegerField(required=False)

    def validate(self, attrs):
        try:
            application = JobApplication.objects.select_related(
                "candidate__user", "position"
            ).get(id=attrs["application_id"])
        except JobApplication.DoesNotExist:
            raise serializers.ValidationError(
                {"application_id": "Unknown job application."}
            )

        duplicate = Evaluation.objects.filter(application=application, status="in_progress").exists()
        if duplicate:
            raise serializers.ValidationError(
                {"application_id": "This application already has an in-progress test."}
            )

        template_pairs: list[dict] = []
        explicit_template_id = attrs.get("template_id")
        if explicit_template_id:
            try:
                template = Template.objects.get(id=explicit_template_id)
            except Template.DoesNotExist:
                raise serializers.ValidationError({"template_id": "Unknown template."})

            template_version = (
                TemplateVersion.objects.filter(template=template)
                .order_by("-version")
                .first()
            )
            if not template_version:
                raise serializers.ValidationError(
                    {"template_id": "No template version exists for this template."}
                )

            assigned_to = None
            assigned_to_id = attrs.get("assigned_to_id")
            if assigned_to_id is not None:
                try:
                    assigned_to = User.objects.get(id=assigned_to_id)
                except User.DoesNotExist:
                    raise serializers.ValidationError(
                        {"assigned_to_id": "Unknown assigned user."}
                    )

            template_pairs.append(
                {
                    "template_version": template_version,
                    "assigned_to": assigned_to,
                }
            )
        else:
            assignments = (
                PositionTestTemplateAssignment.objects.select_related("template", "manager")
                .filter(position=application.position)
                .order_by("order", "id")
            )
            if not assignments.exists():
                raise serializers.ValidationError(
                    {"application_id": "No test templates are configured for this position."}
                )

            for assignment in assignments:
                template_version = (
                    TemplateVersion.objects.filter(template=assignment.template)
                    .order_by("-version")
                    .first()
                )
                if not template_version:
                    raise serializers.ValidationError(
                        {
                            "application_id": (
                                f"Template '{assignment.template.name}' has no version."
                            )
                        }
                    )

                template_pairs.append(
                    {
                        "template_version": template_version,
                        "assigned_to": assignment.manager,
                    }
                )

        attrs["application"] = application
        attrs["template_pairs"] = template_pairs
        return attrs

    def create(self, validated_data):
        application = validated_data["application"]
        evaluations = []
        for pair in validated_data["template_pairs"]:
            evaluation = Evaluation.objects.create(
                subject=application.candidate.user,
                application=application,
                position=application.position,
                template_version=pair["template_version"],
                assigned_to=pair["assigned_to"],
                status="in_progress",
            )
            evaluations.append(evaluation)
        return evaluations


class EvaluationQuestionnaireAnswerInputSerializer(serializers.Serializer):
    question_id = serializers.IntegerField()
    candidate_answer = serializers.CharField(required=False, allow_blank=True)
    manager_comment = serializers.CharField(required=False, allow_blank=True)
    score = serializers.IntegerField(required=False, allow_null=True)


class EvaluationQuestionnaireUpdateSerializer(serializers.Serializer):
    answers = EvaluationQuestionnaireAnswerInputSerializer(many=True)

    def validate_answers(self, value):
        if not value:
            raise serializers.ValidationError("At least one answer is required.")
        return value


class EvaluationQuestionnaireQuestionSerializer(serializers.Serializer):
    question_id = serializers.IntegerField()
    title = serializers.CharField()
    text = serializers.CharField()
    is_mandatory = serializers.BooleanField()
    points = serializers.IntegerField()
    candidate_answer = serializers.CharField(allow_blank=True)
    manager_comment = serializers.CharField(allow_blank=True)
    score = serializers.IntegerField(allow_null=True)


def build_questionnaire_payload(evaluation: Evaluation) -> dict:
    template = evaluation.template_version.template
    rules = template.pool_rules.select_related("pool").all().order_by("order", "id")
    pool_ids = [rule.pool_id for rule in rules]
    questions = SkillQuestion.objects.filter(pool_id__in=pool_ids).order_by("order", "id")
    responses_by_question = {
        response.question_id: response
        for response in EvaluationResponse.objects.filter(evaluation=evaluation).select_related(
            "question"
        )
    }

    serialized_questions = []
    for question in questions:
        response = responses_by_question.get(question.id)
        serialized_questions.append(
            {
                "question_id": question.id,
                "title": question.title,
                "text": question.text,
                "is_mandatory": question.is_mandatory,
                "points": question.points,
                "candidate_answer": response.candidate_answer if response else "",
                "manager_comment": response.manager_comment if response else "",
                "score": response.score if response else None,
            }
        )

    return {
        "evaluation_id": evaluation.id,
        "template_name": template.name,
        "questions": serialized_questions,
    }
