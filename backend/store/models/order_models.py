import uuid

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

    # Canonical payment-method values. These MUST match the values the frontend
    # sends/compares against (CheckoutPage dropdown + OrdersPage gateway logic).
    PAYMENT_METHOD_CHOICES = [
        ('COD', 'Cash on Delivery (COD)'),
        ('CARD', 'Credit/Debit Card'),
        ('Esewa', 'eSewa'),
        ('Khalti', 'Khalti'),
    ]

    user = models.ForeignKey(User, related_name='orders', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    name = models.CharField(max_length=100, default="Unknown")
    address = models.CharField(max_length=255, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    payment_method = models.CharField(max_length=100, choices=PAYMENT_METHOD_CHOICES, default='COD')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    is_paid = models.BooleanField(default=False)

    transaction_uuid = models.UUIDField(unique=True, null=True, blank=True, editable=False)
    pidx = models.CharField(max_length=100, unique=True, null=True, blank=True)
    esewa_signature = models.CharField(max_length=200, null=True, blank=True)

    def __str__(self):
        return f'Order {self.id} by {self.user.username}'


class SubOrder(models.Model):
    """One slice of a Master Order, belonging to a single shop.

    A checkout creates ONE Order (the customer's master receipt) and N SubOrders
    (one per shop in the cart). Each vendor only ever sees/manages their SubOrders.
    """

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('shipped', 'Shipped'),
        ('delivered', 'Delivered'),
    ]

    order = models.ForeignKey(Order, related_name='sub_orders', on_delete=models.CASCADE)
    shop = models.ForeignKey('store.Shop', related_name='sub_orders', on_delete=models.CASCADE)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'SubOrder {self.id} (order {self.order_id}, shop {self.shop_id})'


class OrderItem(models.Model):
    # The authoritative owner of an item is now the SubOrder.
    # `order` is kept (nullable) for backward-compatibility and easy
    # "all items in this master order" queries — `seed_legacy_shop` backfills
    # `sub_order` for old rows. Once you've verified everything you may drop
    # `order` with one more migration. No clash on related_name='items' because
    # the two reverse accessors live on different models (Order vs SubOrder).
    order = models.ForeignKey(
        Order, related_name='items', on_delete=models.CASCADE,
        null=True, blank=True,
    )
    sub_order = models.ForeignKey(
        SubOrder, related_name='items', on_delete=models.CASCADE,
        null=True, blank=True,
    )
    product = models.ForeignKey(Product, related_name='order_items', on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    price = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f'{self.quantity} x {self.product.name} in Order {self.order_id}'
