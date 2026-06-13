from django.db import models
from django.contrib.auth.models import User
from .product_models import Product


class Cart(models.Model):
    user = models.ForeignKey(User, related_name='cart', on_delete=models.CASCADE, null=True, blank=True)
    session_key = models.CharField(max_length=100, unique=True, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        if self.user:
            return f"Cart {self.id} for {self.user.username}"
        return f"Cart {self.id} (session {self.session_key})"

    @property
    def total(self):
        return sum(item.subtotal for item in self.items.all())

class CartItem(models.Model):
    cart = models.ForeignKey(Cart, related_name='items', on_delete=models.CASCADE)
    product = models.ForeignKey(Product, related_name='cart_items', on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)

    def __str__(self):
        return f'{self.quantity} x {self.product.name} in Cart {self.cart.id}'

    @property
    def subtotal(self):
        return self.quantity * self.product.price
