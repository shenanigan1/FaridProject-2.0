from rest_framework import serializers
from django.db import transaction

from templates_grid.models import (
    QuestionPool,
    Template,
    TemplateSection,
    TemplatePoolRule,
)


class TemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Template
        fields = [
            "id",
            "name",
            "is_active",
            "difficulty",
            "duration_minutes",
            "min_pass_score",
            "created_at",
            "updated_at",
        ]

        read_only_fields = ["id", "created_at", "updated_at"]


class TemplateSectionSerializer(serializers.ModelSerializer):
    template = serializers.PrimaryKeyRelatedField(queryset=Template.objects.all())

    class Meta:
        model = TemplateSection
        fields = [
            "id",
            "template",
            "name",
            "description",
            "weight",
            "order",
        ]
        read_only_fields = ["id", "template"]


# -------------------------
# WRITE (input) serializers
# -------------------------


class PoolRuleInSerializer(serializers.Serializer):
    poolId = serializers.IntegerField()
    randomCount = serializers.IntegerField(min_value=0)


class SectionInSerializer(serializers.Serializer):
    title = serializers.CharField()
    description = serializers.CharField(required=False, allow_blank=True)
    weight = serializers.IntegerField(min_value=0, max_value=100)
    pools = PoolRuleInSerializer(many=True, required=False)


# -------------------------
# READ (output) serializers
# -------------------------


class TemplatePoolRuleReadSerializer(serializers.ModelSerializer):
    poolId = serializers.CharField(source="pool_id")
    randomCount = serializers.IntegerField(source="random_count")

    class Meta:
        model = TemplatePoolRule
        fields = ["poolId", "randomCount", "order"]


class TemplateSectionReadSerializer(serializers.ModelSerializer):
    title = serializers.CharField(source="name")
    pools = TemplatePoolRuleReadSerializer(many=True, source="pool_rules")
    weight = serializers.IntegerField(min_value=0, max_value=1000000)

    class Meta:
        model = TemplateSection
        fields = ["id", "title", "description", "weight", "order", "pools"]


class TemplateEditorSerializer(serializers.ModelSerializer):
    # WRITE input
    sections = SectionInSerializer(many=True, required=False, write_only=True)

    # READ output
    sections_read = TemplateSectionReadSerializer(
        many=True, source="sections", read_only=True
    )

    class Meta:
        model = Template
        fields = [
            "id",
            "name",
            "is_active",
            "difficulty",
            "duration_minutes",
            "min_pass_score",
            "sections",  # write-only
            "sections_read",  # read-only
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at", "sections_read"]

    # def validate_sections(self, value):
    #     if not value:
    #         return value
    #     total = sum(int(s.get("weight", 0)) for s in value)
    #     if total != 100:
    #         raise serializers.ValidationError(f"Total section weight must equal 100 (got {total}).")
    #     return value

    @transaction.atomic
    def create(self, validated_data):
        sections_data = validated_data.pop("sections", [])
        template = Template.objects.create(**validated_data)

        if sections_data:
            self._replace_sections(template, sections_data)

        return template

    @transaction.atomic
    def update(self, instance, validated_data):
        sections_data = validated_data.pop("sections", None)

        for k, v in validated_data.items():
            setattr(instance, k, v)
        instance.save()

        if sections_data is None:
            return instance

        self._replace_sections(instance, sections_data)
        return instance

    def _replace_sections(self, template: Template, sections_data: list[dict]) -> None:
        TemplatePoolRule.objects.filter(template=template).delete()
        TemplateSection.objects.filter(template=template).delete()

        pool_ids = {
            int(pr["poolId"])
            for s in sections_data
            for pr in s.get("pools", [])
            if pr.get("poolId") is not None
        }
        pools_by_id = {p.id: p for p in QuestionPool.objects.filter(id__in=pool_ids)}

        missing = [pid for pid in pool_ids if pid not in pools_by_id]
        if missing:
            raise serializers.ValidationError(
                {"sections": [f"Unknown poolId(s): {missing}"]}
            )

        for order, s in enumerate(sections_data):
            section = TemplateSection.objects.create(
                template=template,
                name=s["title"],
                description=s.get("description", ""),
                weight=s.get("weight", 0),
                order=order,
            )

            for pr_order, pr in enumerate(s.get("pools", [])):
                TemplatePoolRule.objects.create(
                    template=template,
                    section=section,
                    pool=pools_by_id[pr["poolId"]],
                    random_count=int(pr["randomCount"]),
                    order=pr_order,
                )

    def to_representation(self, instance):
        """
        Optional: return sections under the key `sections` (instead of `sections_read`)
        so the frontend can keep using `dto.sections`.
        """
        data = super().to_representation(instance)
        data["sections"] = data.pop("sections_read", [])
        return data
