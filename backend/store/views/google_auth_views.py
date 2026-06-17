import requests
from django.contrib.auth.models import User
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken, AccessToken


class OAuthLoginView(APIView):
    permission_classes = []

    PROVIDER_CONFIG = {
        'google': {
            'token_endpoint': 'https://oauth2.googleapis.com/token',
            'userinfo_endpoint': 'https://www.googleapis.com/oauth2/v2/userinfo',
            'client_id_setting': 'GOOGLE_CLIENT_ID',
            'client_secret_setting': 'GOOGLE_CLIENT_SECRET',
            'redirect_uri_setting': 'GOOGLE_REDIRECT_URI',
            'parse_userinfo': lambda data: (
                data.get('email'),
                data.get('given_name', ''),
                data.get('family_name', '')
            ),
            'user_id_field': 'id',  # kept for reference, but not used
        },
        'facebook': {
            'token_endpoint': 'https://graph.facebook.com/v18.0/oauth/access_token',
            'userinfo_endpoint': 'https://graph.facebook.com/me',
            'client_id_setting': 'FACEBOOK_CLIENT_ID',
            'client_secret_setting': 'FACEBOOK_CLIENT_SECRET',
            'redirect_uri_setting': 'FACEBOOK_REDIRECT_URI',
            'userinfo_params': {'fields': 'id,name,email,first_name,last_name'},
            'parse_userinfo': lambda data: (
                data.get('email'),
                data.get('first_name', ''),
                data.get('last_name', '')
            ),
            'user_id_field': 'id',
        },
        'tiktok': {
            'token_endpoint': 'https://open-api.tiktok.com/oauth/token/',
            'userinfo_endpoint': 'https://open-api.tiktok.com/userinfo/',
            'client_id_setting': 'TIKTOK_CLIENT_ID',
            'client_secret_setting': 'TIKTOK_CLIENT_SECRET',
            'redirect_uri_setting': 'TIKTOK_REDIRECT_URI',
            'parse_userinfo': lambda data: (
                data.get('email'),
                data.get('display_name', ''),
                ''
            ),
            'user_id_field': 'open_id',
        }
    }

    def post(self, request, provider):
        if provider not in self.PROVIDER_CONFIG:
            return Response(
                {'error': f'Unsupported provider: {provider}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        config = self.PROVIDER_CONFIG[provider]
        code = request.data.get('code')
        if not code:
            return Response(
                {'error': 'Authorization code is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Retrieve settings
        client_id = getattr(settings, config['client_id_setting'], None)
        client_secret = getattr(settings, config['client_secret_setting'], None)
        redirect_uri = getattr(settings, config['redirect_uri_setting'], None)

        if not all([client_id, client_secret, redirect_uri]):
            return Response(
                {'error': f'Missing OAuth configuration for {provider}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # Exchange code for access token
        token_data = {
            'code': code,
            'client_id': client_id,
            'client_secret': client_secret,
            'redirect_uri': redirect_uri,
            'grant_type': 'authorization_code',
        }

        token_res = requests.post(config['token_endpoint'], data=token_data)
        if token_res.status_code != 200:
            print(f"Token exchange failed for {provider}: {token_res.text}")
            return Response(
                {'error': f'Failed to fetch access token from {provider.capitalize()}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        tokens = token_res.json()
        access_token = tokens.get('access_token')
        if not access_token:
            return Response(
                {'error': 'Access token not found in response'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Fetch user info
        userinfo_params = config.get('userinfo_params', {})
        userinfo_res = requests.get(
            config['userinfo_endpoint'],
            headers={'Authorization': f'Bearer {access_token}'},
            params=userinfo_params
        )
        if userinfo_res.status_code != 200:
            print(f"User info failed for {provider}: {userinfo_res.text}")
            return Response(
                {'error': f'Failed to fetch user data from {provider.capitalize()}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user_info = userinfo_res.json()

        # Parse user info
        parse_fn = config['parse_userinfo']
        email, first_name, last_name = parse_fn(user_info)

        if not email:
            return Response(
                {
                    'error': (
                        f'Email is required from {provider.capitalize()}. '
                        'Please ensure you have granted email permissions.'
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create or retrieve user (email is now guaranteed)
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'username': email,
                'first_name': first_name,
                'last_name': last_name,
            }
        )
        if created:
            user.set_unusable_password()
            user.save()

        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        access = AccessToken.for_user(user)

        return Response({
            'access': str(access),
            'refresh': str(refresh),
            'user': {
                'id': user.id,
                'email': user.email,
                'username': user.username,
                'first_name': user.first_name,
                'last_name': user.last_name,
            }
        }, status=status.HTTP_200_OK)