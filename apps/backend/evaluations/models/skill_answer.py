from django.db import models
from templates_grid.models.skill_question import SkillQuestion

class SkillAnswer(models.Model):
    evaluation = models.ForeignKey("evaluations.Evaluation", on_delete=models.CASCADE, related_name="skill_answers")
    question = models.ForeignKey(SkillQuestion, on_delete=models.CASCADE)
    value = models.IntegerField()

    def __str__(self):
        return f"{self.evaluation.id} — {self.question.label} = {self.value}"
