from django.db import models

class Candidate(models.Model):
    first_name = models.CharField(max_length=100)      # required
    last_name = models.CharField(max_length=100)       # required
    email = models.EmailField(unique=True)             # required
    phone = models.CharField(max_length=20, blank=True)  # optional

    status = models.CharField(max_length=50, default="pending") # optional
    target_position_id = models.IntegerField(null=True, blank=True)        # optional
    flag = models.BooleanField(default=False) # optional — needed for tests
    
    def __str__(self):
        return f"{self.first_name} {self.last_name}"
