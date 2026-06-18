from django.http import HttpRequest
from django.shortcuts import get_object_or_404
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from ..models import Cart, Order, OrderItem
from ..permissions import IsOrderManager
from ..serializers import OrderSerializer

@api_view(['GET'])
@permission_classes([IsOrderManager])
def get_all_orders(request: HttpRequest):
    orders = Order.objects.all().order_by('-created_at')
    orders_cleaned = OrderSerializer(orders, many=True)
    return Response(orders_cleaned.data)


# Admin-only: change the status of ANY order (approve / move along the pipeline).
VALID_STATUSES = [choice[0] for choice in Order.STATUS_CHOICES]

@api_view(['PATCH'])
@permission_classes([IsOrderManager])
def admin_update_order_status(request: HttpRequest, pk):
    order = get_object_or_404(Order, pk=pk)

    new_status = request.data.get('status')
    if new_status not in VALID_STATUSES:
        return Response(
            {'error': f'Invalid status. Choose one of: {", ".join(VALID_STATUSES)}'},
            status=400,
        )

    order.status = new_status
    # COD is collected in cash when the parcel is handed over, so a COD order
    # only becomes paid once it's actually delivered. Online orders
    # (eSewa/Khalti) have their is_paid flipped by the gateway confirm views,
    # so we never touch payment state for them here.
    if order.payment_method == 'COD' and new_status == 'delivered':
        order.is_paid = True
    order.save()

    return Response({
        'message': 'Order status updated',
        'order_id': order.id,
        'status': order.status,
        'is_paid': order.is_paid,
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_orders(request: HttpRequest):
    orders = Order.objects.filter(user=request.user).all()
    orders_cleaned = OrderSerializer(orders, many=True)
    return Response(orders_cleaned.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_order(request: HttpRequest, pk):
    order = get_object_or_404(Order, pk=pk)
    order_cleaned = OrderSerializer(order)
    return Response(order_cleaned.data)

@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def update_order(request: HttpRequest, pk):
    order = get_object_or_404(Order, pk=pk, user=request.user)

    is_partial = (request.method == 'PATCH')
    serializer = OrderSerializer(order, data=request.data, partial=is_partial)
    serializer.is_valid(raise_exception=True)
    updated_order = serializer.save()

    return Response({
        'message': 'Order updated successfully',
        'order_id': updated_order.id,
    })

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_order(request: HttpRequest, pk):
    order = get_object_or_404(Order, pk=pk, user=request.user)
    order.delete()
    return Response({'message': 'Order cancelled successfully'})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_order(request: HttpRequest):
    try:
        data = request.data
        name = data.get('name')
        address = data.get('address')
        phone = data.get('phone')
        payment_method = data.get('payment_method', 'COD')

        cart = Cart.objects.filter(user=request.user).first()
        if not cart or not cart.items.exists():
            return Response({'error': 'Cart not found'}, status=404)

        total = sum(float(items.product.price) * items.quantity for items in cart.items.all())
        order = Order.objects.create(
            user=request.user,
            name=name,
            phone=phone,
            address=address,
            payment_method=payment_method,
            total_price = total,
        )

        for item in cart.items.all():
            OrderItem.objects.create(
                order = order,
                product = item.product,
                quantity = item.quantity,
                price = item.product.price,
            )

        cart.delete()

        return Response({
            'message': 'Order created successfully',
            'order_id': order.id,
        })

    except Exception as e:
        return Response({'error': str(e)}, status=400)
