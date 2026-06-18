from django.db import models
from django.contrib.auth.models import User
from django.utils.text import slugify


class Shop(models.Model):
    """A vendor's storefront. Each user owns at most one shop (OneToOne)."""

    name = models.CharField(max_length=255)
    slug = models.SlugField(unique=True, blank=True)
    # OneToOne: one user owns one shop. `user.shop` -> their Shop instance.
    owner = models.OneToOneField(User, related_name='shop', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        # Auto-generate a slug from the name on first save if none is given.
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name
