from rest_framework import serializers
from templates_grid.models import SkillQuestion
from templates_grid.models import QuestionFormat, Difficulty


def _clean_string_list(value) -> list[str]:
    if not isinstance(value, list):
        return []
    return [item.strip() for item in value if isinstance(item, str) and item.strip()]


def _as_rubric(value) -> dict:
    return value if isinstance(value, dict) else {}


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
        normalized_rubric = _as_rubric(rubric)

        if fmt == QuestionFormat.PRACTICAL:
            # You can decide if rubric is required or just recommended.
            # Here: enforce not empty dict/list/None.
            if rubric in (None, "", {}, []):
                raise serializers.ValidationError(
                    {"rubric": "Rubric is required for practical questions."}
                )

        if fmt == QuestionFormat.MCQ:
            options = _clean_string_list(normalized_rubric.get("options"))
            correct_answers = _clean_string_list(
                normalized_rubric.get("correct_answers")
            )
            if options:
                unknown_answers = [
                    answer for answer in correct_answers if answer not in options
                ]
                if unknown_answers:
                    raise serializers.ValidationError(
                        {
                            "rubric": (
                                "Correct answers must be selected from the QCM options."
                            )
                        }
                    )
                normalized_rubric["options"] = options
                if correct_answers:
                    normalized_rubric["correct_answers"] = correct_answers
                attrs["rubric"] = normalized_rubric

        if fmt == QuestionFormat.TRUE_FALSE:
            correct_answers = _clean_string_list(
                normalized_rubric.get("correct_answers")
            )
            normalized_rubric["options"] = ["Vrai", "Faux"]
            if correct_answers:
                unknown_answers = [
                    answer
                    for answer in correct_answers
                    if answer not in normalized_rubric["options"]
                ]
                if unknown_answers:
                    raise serializers.ValidationError(
                        {"rubric": "Correct answer must be Vrai or Faux."}
                    )
                normalized_rubric["correct_answers"] = correct_answers
            attrs["rubric"] = normalized_rubric

        if fmt == QuestionFormat.YES_NO:
            correct_answers = _clean_string_list(
                normalized_rubric.get("correct_answers")
            )
            normalized_rubric["options"] = ["Oui", "Non"]
            if correct_answers:
                unknown_answers = [
                    answer
                    for answer in correct_answers
                    if answer not in normalized_rubric["options"]
                ]
                if unknown_answers:
                    raise serializers.ValidationError(
                        {"rubric": "Correct answer must be Oui or Non."}
                    )
                normalized_rubric["correct_answers"] = correct_answers
            attrs["rubric"] = normalized_rubric

        if fmt == QuestionFormat.FREE_TEXT:
            expected_answer = attrs.get(
                "explanation", getattr(self.instance, "explanation", "")
            )
            normalized_rubric.setdefault("scoring", "manual")
            if expected_answer:
                normalized_rubric["expected_answer"] = expected_answer
            attrs["rubric"] = normalized_rubric

        if fmt == QuestionFormat.RATING:
            normalized_rubric.setdefault("scoring", "rating")
            attrs["rubric"] = normalized_rubric

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
