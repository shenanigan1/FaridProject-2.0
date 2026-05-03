from rest_framework import serializers
from evaluations.models import Evaluation
from candidates.models import Candidate
from templates_grid.models import Template
from templates_grid.models import TemplateVersion
from users.models import User
from users.models import UserRoles
from recruitment.models import JobApplication
from positions.models import PositionTestTemplateAssignment
from templates_grid.models import SkillQuestion
from templates_grid.models import VersionedPool
from templates_grid.models import VersionedSection
from evaluations.models import EvaluationResponse
from evaluations.models import EvaluationSectionAssignment


class EvaluationSerializer(serializers.ModelSerializer):
    template_name = serializers.CharField(
        source="template_version.template.name", read_only=True
    )
    subject_full_name = serializers.SerializerMethodField()
    subject_email = serializers.EmailField(source="subject.email", read_only=True)
    position_title = serializers.SerializerMethodField()
    assigned_to_full_name = serializers.SerializerMethodField()
    completed_sections_count = serializers.SerializerMethodField()
    total_sections_count = serializers.SerializerMethodField()
    progress_percent = serializers.SerializerMethodField()

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
            "subject_full_name",
            "subject_email",
            "position_title",
            "assigned_to_full_name",
            "completed_sections_count",
            "total_sections_count",
            "progress_percent",
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

    def get_subject_full_name(self, obj: Evaluation) -> str:
        return obj.subject.email

    def get_position_title(self, obj: Evaluation) -> str:
        return obj.position.title if obj.position else ""

    def get_assigned_to_full_name(self, obj: Evaluation) -> str:
        if not obj.assigned_to:
            return ""
        return obj.assigned_to.full_name or obj.assigned_to.email

    def get_total_sections_count(self, obj: Evaluation) -> int:
        return obj.section_assignments.count()

    def get_completed_sections_count(self, obj: Evaluation) -> int:
        return obj.section_assignments.filter(completed_at__isnull=False).count()

    def get_progress_percent(self, obj: Evaluation) -> int:
        if obj.status in {"completed", "validated"}:
            return 100

        total = self.get_total_sections_count(obj)
        if total <= 0:
            return 0

        completed = self.get_completed_sections_count(obj)
        return round((completed / total) * 100)


class SubjectEvaluationSerializer(serializers.ModelSerializer):
    template_name = serializers.CharField(
        source="template_version.template.name", read_only=True
    )

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
    section_assignments = serializers.ListField(
        child=serializers.DictField(), required=False
    )

    @staticmethod
    def _resolve_template_version(template: Template) -> TemplateVersion:
        latest = (
            TemplateVersion.objects.filter(template=template)
            .order_by("-version")
            .first()
        )
        if latest:
            LaunchEvaluationSerializer._ensure_template_snapshot(latest)
            return latest

        version = TemplateVersion.objects.create(template=template, version=1)
        LaunchEvaluationSerializer._ensure_template_snapshot(version)
        return version

    @staticmethod
    def _ensure_template_snapshot(template_version: TemplateVersion) -> None:
        if template_version.sections.exists():
            return

        template = template_version.template
        sections = template.sections.prefetch_related("pool_rules__pool").order_by(
            "order", "id"
        )
        for section in sections:
            versioned_section = VersionedSection.objects.create(
                template_version=template_version,
                name=section.name,
                order=section.order,
            )
            for rule in section.pool_rules.select_related("pool").order_by(
                "order", "id"
            ):
                VersionedPool.objects.create(
                    template_version=template_version,
                    section=versioned_section,
                    name=rule.pool.name,
                    code=rule.pool.code,
                    random_count=rule.random_count,
                    order=rule.order,
                )

    def _validate_section_assignments(
        self, template: Template, raw_assignments: list[dict]
    ) -> dict[int, User]:
        section_ids = set(template.sections.values_list("id", flat=True))
        parsed: dict[int, User] = {}

        for item in raw_assignments:
            try:
                section_id = int(item.get("section_id"))
                manager_id = int(item.get("manager_id"))
            except (TypeError, ValueError):
                raise serializers.ValidationError(
                    {
                        "section_assignments": (
                            "Each section assignment needs section_id and manager_id."
                        )
                    }
                )

            if section_id not in section_ids:
                raise serializers.ValidationError(
                    {"section_assignments": f"Section {section_id} is not in template."}
                )

            try:
                manager = User.objects.get(id=manager_id, role=UserRoles.MANAGER)
            except User.DoesNotExist:
                raise serializers.ValidationError(
                    {"section_assignments": f"Unknown manager {manager_id}."}
                )
            parsed[section_id] = manager

        return parsed

    def validate(self, attrs):
        try:
            application = JobApplication.objects.select_related(
                "candidate__user", "position"
            ).get(id=attrs["application_id"])
        except JobApplication.DoesNotExist:
            raise serializers.ValidationError(
                {"application_id": "Unknown job application."}
            )

        duplicate = Evaluation.objects.filter(
            application=application, status="in_progress"
        ).exists()
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

            template_version = self._resolve_template_version(template)
            section_assignments = self._validate_section_assignments(
                template, attrs.get("section_assignments", [])
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
                    "section_assignments": section_assignments,
                }
            )
        else:
            assignments = (
                PositionTestTemplateAssignment.objects.select_related(
                    "template", "manager"
                )
                .filter(position=application.position)
                .order_by("order", "id")
            )
            if not assignments.exists():
                fallback_template = (
                    Template.objects.filter(is_active=True)
                    .order_by("-updated_at", "-id")
                    .first()
                )
                if not fallback_template:
                    raise serializers.ValidationError(
                        {
                            "application_id": (
                                "No active templates are available to launch a test."
                            )
                        }
                    )
                template_pairs.append(
                    {
                        "template_version": self._resolve_template_version(
                            fallback_template
                        ),
                        "assigned_to": None,
                        "section_assignments": {},
                    }
                )
                attrs["application"] = application
                attrs["template_pairs"] = template_pairs
                return attrs

            for assignment in assignments:
                template_version = self._resolve_template_version(assignment.template)
                template_pairs.append(
                    {
                        "template_version": template_version,
                        "assigned_to": assignment.manager,
                        "section_assignments": {},
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
            self._create_section_assignments(
                evaluation=evaluation,
                section_assignments=pair["section_assignments"],
                fallback_manager=pair["assigned_to"],
            )
            evaluations.append(evaluation)
        return evaluations

    def _create_section_assignments(
        self,
        evaluation: Evaluation,
        section_assignments: dict[int, User],
        fallback_manager: User | None,
    ) -> None:
        template = evaluation.template_version.template
        versioned_sections = {
            (section.name, section.order): section
            for section in evaluation.template_version.sections.all()
        }

        for section in template.sections.all().order_by("order", "id"):
            manager = section_assignments.get(section.id, fallback_manager)
            if manager is None:
                continue

            versioned_section = versioned_sections.get((section.name, section.order))
            if versioned_section is None:
                continue

            EvaluationSectionAssignment.objects.get_or_create(
                evaluation=evaluation,
                section=versioned_section,
                defaults={"assigned_to": manager},
            )


class EvaluationQuestionnaireAnswerInputSerializer(serializers.Serializer):
    question_id = serializers.IntegerField()
    candidate_answer = serializers.CharField(required=False, allow_blank=True)
    manager_comment = serializers.CharField(required=False, allow_blank=True)
    score = serializers.IntegerField(required=False, allow_null=True)


class EvaluationQuestionnaireSectionInputSerializer(serializers.Serializer):
    section_id = serializers.IntegerField()
    manager_comment = serializers.CharField(required=False, allow_blank=True)
    completed = serializers.BooleanField(required=False)


class EvaluationQuestionnaireUpdateSerializer(serializers.Serializer):
    answers = EvaluationQuestionnaireAnswerInputSerializer(many=True, required=False)
    section_comments = EvaluationQuestionnaireSectionInputSerializer(
        many=True, required=False
    )
    test_manager_comment = serializers.CharField(required=False, allow_blank=True)
    complete_sections = serializers.BooleanField(required=False, default=False)

    def validate_answers(self, value):
        if value is None:
            return []
        return value

    def validate(self, attrs):
        if (
            not attrs.get("answers")
            and not attrs.get("section_comments")
            and "test_manager_comment" not in attrs
            and not attrs.get("complete_sections")
        ):
            raise serializers.ValidationError("Nothing to save.")
        return attrs


class EvaluationQuestionnaireQuestionSerializer(serializers.Serializer):
    question_id = serializers.IntegerField()
    format = serializers.CharField()
    title = serializers.CharField()
    text = serializers.CharField()
    explanation = serializers.CharField(allow_blank=True)
    is_mandatory = serializers.BooleanField()
    points = serializers.IntegerField()
    difficulty = serializers.CharField()
    rubric = serializers.JSONField()
    candidate_answer = serializers.CharField(allow_blank=True)
    manager_comment = serializers.CharField(allow_blank=True)
    score = serializers.IntegerField(allow_null=True)


def _manager_can_access_assignment(
    user, assignment: EvaluationSectionAssignment | None
) -> bool:
    return getattr(user, "role", None) != UserRoles.MANAGER or (
        assignment is not None and assignment.assigned_to_id == user.id
    )


def _assignment_name(assignment: EvaluationSectionAssignment | None) -> str:
    if assignment is None:
        return ""
    return assignment.assigned_to.full_name or assignment.assigned_to.email


def _questions_for_rule(rule) -> list[SkillQuestion]:
    questions = list(rule.pool.questions.all().order_by("order", "id"))
    if rule.random_count <= 0:
        return questions

    mandatory = [question for question in questions if question.is_mandatory]
    optional = [question for question in questions if not question.is_mandatory]
    return mandatory + optional[: rule.random_count]


def build_questionnaire_payload(evaluation: Evaluation, user=None) -> dict:
    template = evaluation.template_version.template
    sections = (
        template.sections.prefetch_related("pool_rules__pool__questions")
        .all()
        .order_by("order", "id")
    )
    assignments_by_key = {
        (assignment.section.name, assignment.section.order): assignment
        for assignment in evaluation.section_assignments.select_related(
            "section", "assigned_to"
        )
    }
    responses_by_question = {
        response.question_id: response
        for response in EvaluationResponse.objects.filter(
            evaluation=evaluation
        ).select_related("question")
    }

    serialized_sections = []
    flat_questions = []
    for section in sections:
        assignment = assignments_by_key.get((section.name, section.order))
        if user is not None and not _manager_can_access_assignment(user, assignment):
            if getattr(user, "role", None) == UserRoles.MANAGER:
                continue

        serialized_questions = []
        for rule in section.pool_rules.all().order_by("order", "id"):
            for question in _questions_for_rule(rule):
                response = responses_by_question.get(question.id)
                serialized_question = {
                    "question_id": question.id,
                    "section_id": section.id,
                    "section_title": section.name,
                    "format": question.format,
                    "title": question.title,
                    "text": question.text,
                    "explanation": question.explanation,
                    "is_mandatory": question.is_mandatory,
                    "points": question.points,
                    "difficulty": question.difficulty,
                    "rubric": question.rubric,
                    "candidate_answer": response.candidate_answer if response else "",
                    "manager_comment": response.manager_comment if response else "",
                    "score": response.score if response else None,
                }
                serialized_questions.append(serialized_question)
                flat_questions.append(serialized_question)

        serialized_sections.append(
            {
                "section_id": section.id,
                "title": section.name,
                "description": section.description,
                "weight": section.weight,
                "assigned_to": assignment.assigned_to_id if assignment else None,
                "assigned_to_full_name": _assignment_name(assignment),
                "manager_comment": assignment.manager_comment if assignment else "",
                "completed_at": assignment.completed_at if assignment else None,
                "questions": serialized_questions,
            }
        )

    return {
        "evaluation_id": evaluation.id,
        "template_name": template.name,
        "test_manager_comment": evaluation.internal_comment,
        "sections": serialized_sections,
        "questions": flat_questions,
    }
