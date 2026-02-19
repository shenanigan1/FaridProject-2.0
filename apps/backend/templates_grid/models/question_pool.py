from django.db import models


class QuestionPool(models.Model):
    """
    A pool of questions used inside a template grid.
    Can contain soft skills, hard skills, or any future skill type.
    """
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)

    # Example: "soft_skills_pool", "backend_hard_skills", etc.
    code = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name
