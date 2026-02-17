from django.db import models

class Template(models.Model):
    nom = models.CharField(max_length=255)
    type = models.CharField(max_length=100)
    poste_id = models.IntegerField()

    def __str__(self):
        return self.nom
