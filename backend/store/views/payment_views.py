from django.http import HttpRequest
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from ..serializers import OrderSerializer
from ..models import Order
from rest_framework.generics import get_object_or_404
from django.conf import settings
import uuid, base64, hashlib, hmac, requests, json
from rest_framework.reverse import reverse
from django.utils import timezone
from django.shortcuts import redirect

def get_esewa_signature(total_amount, transaction_uuid, product_code):
    amount_int = int(float(total_amount))
    message = f"total_amount={amount_int},transaction_uuid={transaction_uuid},product_code={product_code}"
    key_bytes = settings.ESEWA_SECRET_KEY.encode('utf-8')
    msg_bytes = message.encode('utf-8')
    hmac_sha256 = hmac.new(key_bytes, msg_bytes, hashlib.sha256)
    return base64.b64encode(hmac_sha256.digest()).decode('utf-8')

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def esewa_checkout(request: HttpRequest, order_id):
    order = get_object_or_404(Order, id=order_id)
    amount = int(float(order.total_price))
    tax_amount = 0
    transaction_uuid = str(uuid.uuid4())
    product_code = settings.ESEWA_PRODUCT_CODE
    product_service_charge = settings.PRODUCT_SERVICE_CHARGE
    product_delivery_charge = settings.PRODUCT_DELIVERY_CHARGE
    total_amount = amount + product_service_charge + product_delivery_charge
    signature = get_esewa_signature(total_amount, transaction_uuid, product_code)
    success_url = request.build_absolute_uri(reverse('esewa_confirm'))
    failure_url = success_url
    order.transaction_uuid = transaction_uuid
    order.esewa_signature = signature
    order.save()
    return Response({
        "amount": amount,
        "tax_amount": tax_amount,
        "transaction_uuid": transaction_uuid,
        "product_code": product_code,
        "product_service_charge": product_service_charge,
        "product_delivery_charge": product_delivery_charge,
        "total_amount": total_amount,
        "signed_field_names": "total_amount,transaction_uuid,product_code",
        "signature": signature,
        "success_url": success_url,
        "failure_url": failure_url
    })

@api_view(['POST'])
def esewa_confirm(request: HttpRequest):
    encoded_data = request.data.get('data')
    if not encoded_data:
        return Response({'error': 'No data received'}, status=400)
    try:
        decoded_bytes = base64.b64decode(encoded_data)
        decoded_string = decoded_bytes.decode('utf-8')
        response_data = json.loads(decoded_string)
        status = response_data.get('status')
        total_amount = response_data.get('total_amount')
        transaction_uuid = response_data.get('transaction_uuid')
        received_signature = response_data.get('signature')
        product_code = settings.ESEWA_PRODUCT_CODE
        if not received_signature:
            return Response({'error': 'Missing signature'}, status=400)
        expected_signature = get_esewa_signature(total_amount, transaction_uuid, product_code)
        if received_signature != expected_signature:
            return Response({'error': 'Invalid signature'}, status=400)
        order = get_object_or_404(Order, transaction_uuid=transaction_uuid)
        expected_total = float(order.total_price) + settings.PRODUCT_SERVICE_CHARGE + settings.PRODUCT_DELIVERY_CHARGE
        if float(total_amount) != expected_total:
            return Response({'error': 'Amount mismatch'}, status=400)
        if status == "COMPLETE":
            status_url = f"https://rc.esewa.com.np/api/epay/transaction/status/?product_code={product_code}&total_amount={total_amount}&transaction_uuid={order.transaction_uuid}"
            response = requests.get(status_url)
            if response.status_code == 200:
                data = response.json()
                if data.get('status') == "COMPLETE":
                    order.is_paid = True
                    order.save()
                    return Response({
                        "message": "Successfully Paid!",
                        "data": OrderSerializer(order).data
                    })
        return Response({'message': 'Payment failed', 'data': response_data}, status=400)
    except Exception as e:
        return Response({'error': f'Processing failed: {str(e)}'}, status=400)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def khalti_checkout(request: HttpRequest, order_id):
    order = get_object_or_404(Order, id=order_id)
    amount_in_paisa = int(order.total_price * 100)
    return_url = request.build_absolute_uri(reverse('khalti_confirm'))
    initiate_url = settings.KHALTI_INITIATE_URL
    website_url = settings.FRONTEND_URL
    purchase_order_id = f"order{order_id}{timezone.now().strftime('%Y-%m-%d_%H-%M-%S')}"
    purchase_order_name = f"Order #{order_id}"
    authorization_key = settings.KHALTI_AUTHORIZATION_KEY
    headers = {
        "Authorization": f"Key {authorization_key}",
        "Accept": "application/json"
    }
    payload = {
        "return_url": return_url,
        "website_url": website_url,
        "amount": amount_in_paisa,
        "purchase_order_id": purchase_order_id,
        "purchase_order_name": purchase_order_name,
        "customer_info": {
            "name": "Test Bahadur",
            "email": "test@khalti.com",
            "phone": "9800000001"
        }
    }
    order.purchase_order_id = purchase_order_id
    order.purchase_order_name = purchase_order_name
    order.save()
    try:
        response = requests.post(initiate_url, headers=headers, json=payload)
        response.raise_for_status()
        data = response.json()
    except requests.exceptions.RequestException as e:
        return Response({"error": str(e)}, status=500)
    order.pidx = data['pidx']
    order.save()
    return Response(data)

@api_view(['GET'])
def khalti_confirm(request: HttpRequest):
    status = request.GET.get('status')
    pidx = request.GET.get('pidx')
    payment_successful = False
    order_id = None
    order = Order.objects.filter(pidx=pidx).first()
    if order and status == "Completed":
        status_url = "https://dev.khalti.com/api/v2/epayment/lookup/"
        authorization_key = settings.KHALTI_AUTHORIZATION_KEY
        headers = {
            "Authorization": f"Key {authorization_key}",
            "Accept": "application/json"
        }
        response = requests.post(status_url, headers=headers, json={"pidx": pidx})
        if response.status_code == 200:
            data = response.json()
            if data.get('status') == 'Completed':
                order.is_paid = True
                order.save()
                order_id = order.id
                payment_successful = True
    frontend_url = settings.FRONTEND_URL
    if payment_successful:
        return redirect(f"{frontend_url}/orders?order_id={order_id}&payment=success")
    else:
        return redirect(f"{frontend_url}/orders?order_id={order_id or ''}&payment=failed")