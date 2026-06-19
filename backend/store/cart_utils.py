from .models import Cart
from django.http import HttpRequest


def get_or_create_cart(request: HttpRequest):
    """Return the authenticated user's server cart.

    The cart is a stateless, authenticated-only REST resource keyed off the
    Bearer JWT — there is no session cookie. Guests keep their cart in the
    browser (localStorage) and push it to the server on login via
    ``sync_local_cart``.
    """
    cart, _ = Cart.objects.get_or_create(user=request.user)
    return cart
