from django.http import HttpRequest
from django.shortcuts import get_object_or_404
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from ..models import Cart, Order, OrderItem
from ..serializers import OrderSerializer


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
        return Response({'error': e}, status=400)
