from django.db import models
from django.contrib.auth.models import User


class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    address = models.CharField(max_length=255, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(max_length=255, blank=True)
    is_active = models.BooleanField(default=False)

    def __str__(self):
        return self.user.username
