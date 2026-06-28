"""Multi-vendor (marketplace) views.

All of these rely on `request.shop`, which is attached by ShopContextMiddleware
from the request subdomain.
"""
from django.db import transaction
from rest_framework import generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import NotFound, ValidationError

from ..models import Cart, Order, SubOrder, OrderItem, Product
from ..permissions import IsShopManager
from ..tasks import send_order_confirmation_task
from ..serializers import (
    ManageProductSerializer,
    SubOrderSerializer,
    OrderSerializer,
)


class ShopScopedMixin:
    """Ensures `request.shop` exists before any shop-scoped query runs.

    Without it a manager request on an unknown subdomain would silently return
    an empty list instead of a clear error.
    """

    def get_shop(self):
        shop = getattr(self.request, 'shop', None)
        if shop is None:
            raise NotFound("No shop in context. Open your shop's subdomain.")
        return shop

class ManageProductListCreateView(ShopScopedMixin, generics.ListCreateAPIView):
    serializer_class = ManageProductSerializer
    permission_classes = [IsShopManager]

    def get_queryset(self):
        return (
            Product.objects.select_related('category', 'shop')
            .filter(shop=self.get_shop())
        )

    def perform_create(self, serializer):
        serializer.save(shop=self.get_shop())


class ManageProductDetailView(ShopScopedMixin, generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ManageProductSerializer
    permission_classes = [IsShopManager]

    def get_queryset(self):
        return Product.objects.select_related('category', 'shop').filter(shop=self.get_shop())


class ShopOrderListView(ShopScopedMixin, generics.ListAPIView):
    serializer_class = SubOrderSerializer
    permission_classes = [IsShopManager]

    def get_queryset(self):
        return (
            SubOrder.objects.filter(shop=self.get_shop())
            .select_related('order', 'shop')
            .prefetch_related('items__product')
            .order_by('-created_at')
        )


class ShopOrderUpdateView(ShopScopedMixin, generics.UpdateAPIView):
    """PATCH a SubOrder's status (pending -> confirmed -> shipped -> delivered)."""
    serializer_class = SubOrderSerializer
    permission_classes = [IsShopManager]

    def get_queryset(self):
        return SubOrder.objects.filter(shop=self.get_shop()).select_related('order', 'shop')

    @transaction.atomic
    def perform_update(self, serializer):
        sub_order = serializer.save()
        self._sync_master_order(sub_order.order)

    @staticmethod
    def _sync_master_order(order):
        """Roll a master order forward once all its SubOrders are delivered.

        For COD this is the moment cash has been collected for the whole basket,
        so the master order is marked delivered + paid. Online orders are
        already paid via the gateway, so we only advance their status.
        """
        statuses = list(order.sub_orders.values_list('status', flat=True))
        if statuses and all(s == 'delivered' for s in statuses):
            order.status = 'delivered'
            if order.payment_method == 'COD':
                order.is_paid = True
            order.save(update_fields=['status', 'is_paid'])


class CustomerOrderListView(generics.ListAPIView):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (
            Order.objects.filter(user=self.request.user)
            .prefetch_related('sub_orders__shop', 'sub_orders__items__product')
            .order_by('-created_at')
        )


class CheckoutView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        data = request.data
        cart = Cart.objects.filter(user=request.user).first()
        if not cart or not cart.items.exists():
            return Response({'error': 'Cart is empty'}, status=400)

        items = list(cart.items.select_related('product', 'product__shop').all())

        if any(item.product.shop_id is None for item in items):
            return Response(
                {'error': 'Some products have no shop assigned. Run `manage.py seed_legacy_shop`.'},
                status=400,
            )

        groups = {}
        for item in items:
            groups.setdefault(item.product.shop, []).append(item)

        total = sum(item.product.price * item.quantity for item in items)

        order = Order.objects.create(
            user=request.user,
            name=data.get('name', ''),
            address=data.get('address', ''),
            phone=data.get('phone', ''),
            payment_method=data.get('payment_method', 'COD'),
            total_price=total,
            status='pending',
            is_paid=False,
        )

        order_items = []
        for shop, shop_items in groups.items():
            subtotal = sum(i.product.price * i.quantity for i in shop_items)
            sub_order = SubOrder.objects.create(
                order=order, shop=shop, subtotal=subtotal, status='pending',
            )
            for i in shop_items:
                order_items.append(
                    OrderItem(
                        order=order,           
                        sub_order=sub_order,   
                        product=i.product,
                        quantity=i.quantity,
                        price=i.product.price,  
                    )
                )
        OrderItem.objects.bulk_create(order_items)

        cart.items.all().delete()

        transaction.on_commit(lambda: send_order_confirmation_task.delay(order.id))

        return Response(
            {
                'message': 'Order placed successfully',
                'order_id': order.id,
                'sub_orders': SubOrder.objects.filter(order=order).count(),
                'order': OrderSerializer(order).data,
            },
            status=201,
        )
