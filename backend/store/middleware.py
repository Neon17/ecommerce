from .models.shop_models import Shop

class ShopContextMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        shop_slug = request.headers.get('X-Shop-Slug')

        if not shop_slug:
            host = request.get_host().split(':')[0]
            parts = host.split('.')
            if len(parts) >= 2 and parts[0] not in ['www', 'api', 'localhost']:
                shop_slug = parts[0]

        request.shop = None
        if shop_slug:
            try:
                request.shop = Shop.objects.get(slug=shop_slug)
            except Shop.DoesNotExist:
                request.shop = None

        return self.get_response(request)

        