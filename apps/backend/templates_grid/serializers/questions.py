from rest_framework import serializers
from templates_grid.models import SkillQuestion
from templates_grid.models import QuestionFormat, Difficulty


class SkillQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = SkillQuestion
        fields = [
            "id",
            "pool",
            "format",
            "title",
            "text",
            "explanation",
            "rubric",
            "is_mandatory",
            "points",
            "difficulty",
            "order",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate_format(self, value: str) -> str:
        value = (value or "").strip()
        allowed = {c[0] for c in QuestionFormat.choices}
        if value not in allowed:
            raise serializers.ValidationError("Invalid format.")
        return value

    def validate_difficulty(self, value: str) -> str:
        value = (value or "").strip()
        allowed = {c[0] for c in Difficulty.choices}
        if value not in allowed:
            raise serializers.ValidationError("Invalid difficulty.")
        return value

    def validate(self, attrs):
        """
        Cross-field validation.
        - Practical questions should have rubric (recommended).
        - Free-text questions are manually scored by the manager through points.
        - Non-practical can keep rubric empty.
        """
        # When partial update, instance may exist
        fmt = attrs.get("format", getattr(self.instance, "format", None))
        rubric = attrs.get("rubric", getattr(self.instance, "rubric", None))

        if fmt == QuestionFormat.PRACTICAL:
            # You can decide if rubric is required or just recommended.
            # Here: enforce not empty dict/list/None.
            if rubric in (None, "", {}, []):
                raise serializers.ValidationError(
                    {"rubric": "Rubric is required for practical questions."}
                )

        if fmt == QuestionFormat.FREE_TEXT and rubric in (None, "", {}, []):
            attrs["rubric"] = {"scoring": "manual"}

        if fmt == QuestionFormat.YES_NO and rubric in (None, "", {}, []):
            attrs["rubric"] = {"options": ["Oui", "Non"]}

        if fmt == QuestionFormat.RATING and rubric in (None, "", {}, []):
            attrs["rubric"] = {"scoring": "rating"}

        points = attrs.get("points", getattr(self.instance, "points", None))
        if points is not None and points < 1:
            raise serializers.ValidationError({"points": "Points must be >= 1."})

        text = attrs.get("text", getattr(self.instance, "text", None))
        if text is not None and len(text.strip()) < 5:
            raise serializers.ValidationError(
                {"text": "Text must be at least 5 characters."}
            )

        title = attrs.get("title", getattr(self.instance, "title", ""))
        if title is not None and len(title) > 255:
            raise serializers.ValidationError({"title": "Title is too long (max 255)."})

        return attrs
