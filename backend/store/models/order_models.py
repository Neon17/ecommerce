from django.db import models
from django.contrib.auth.models import User
from .product_models import Product


class Order(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('confirmed', 'Confirmed'),
        ('on_road', 'On the way'),
        ('delivered', 'Delivered'),
    ]

    user = models.ForeignKey(User, related_name='orders', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    name = models.CharField(max_length=100, default="Unknown")
    address = models.CharField(max_length=255, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    payment_method = models.CharField(max_length=100, default='COD')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    is_paid = models.BooleanField(default=False)

    def __str__(self):
        return f'Order {self.id} by {self.user.username}'

class OrderItem(models.Model):
    order = models.ForeignKey(Order, related_name='items', on_delete=models.CASCADE)
    product = models.ForeignKey(Product, related_name='order_items', on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    price = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f'{self.quantity} x {self.product.name} in Order {self.order.id}'
