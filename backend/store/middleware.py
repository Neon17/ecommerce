from .models.shop_models import Shop

RESERVED_SUBDOMAINS = ('www', 'api', 'localhost')


class ShopContextMiddleware:
    """Resolve the active shop from the request *subdomain* only.

    The subdomain is the single source of truth for multi-vendor scoping — there
    is no ``X-Shop-Slug`` header fallback. A manager reaches their shop by
    visiting ``<slug>.<host>``; everything else (the main domain) has no shop.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        request.shop = None
        request.admin = False

        host = request.get_host().split(':')[0]
        parts = host.split('.')
        if len(parts) >= 2 and parts[0] not in RESERVED_SUBDOMAINS:
            try:
                request.shop = Shop.objects.get(slug=parts[0])
            except Shop.DoesNotExist:
                request.shop = None
                if (parts[0] == 'admin'):
                    request.admin = True

        return self.get_response(request)
