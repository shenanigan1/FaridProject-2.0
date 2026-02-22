from rest_framework import serializers

from templates_grid.models.question_pool import QuestionPool
from templates_grid.models.skill_question import SkillQuestion
from templates_grid.models.template import Template
from templates_grid.models.template_section import TemplateSection
from templates_grid.models.template_pool_rule import TemplatePoolRule

class TemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Template
        fields = ["id", "name", "is_active", "created_at"]
        read_only_fields = ["id", "created_at"]


class TemplateSectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = TemplateSection
        fields = ["id", "template", "name", "order"]
        read_only_fields = ["id"]


