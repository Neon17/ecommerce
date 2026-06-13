import uuid
from .models import Cart, CartItem
from django.http import HttpRequest

def get_cart_session_id(request: HttpRequest):
    """Extract cart session id from HTTP-only cookie"""
    return request.COOKIES.get('cart_session_id')

def set_cart_session_cookie(response, session_id):
    response.set_cookie(
        'cart_session_id',
        session_id,
        max_age=86400*30,
        samesite='lax',
        httponly=True,
        secure=False,
    )

def get_or_create_cart(request: HttpRequest):
    if request.user.is_authenticated:
        cart, created = Cart.objects.get_or_create(user=request.user)
        return cart, None

    session_id = get_cart_session_id(request)
    if session_id:
        try:
            cart = Cart.objects.get(session_key=session_id, user=None)
            return cart, None
        except Cart.DoesNotExist:
            pass

    new_session_id = str(uuid.uuid4())
    cart = Cart.objects.create(session_key=new_session_id, user=None)
    return cart, new_session_id
