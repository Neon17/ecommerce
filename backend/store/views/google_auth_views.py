import requests
from django.contrib.auth.models import User
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken, AccessToken


class GoogleLoginView(APIView):
    permission_classes = []

    def post(self, request):
        code = request.data.get('code')
        if not code:
            return Response({'error': 'Code is required'}, status=status.HTTP_400_BAD_REQUEST)

        token_endpoint = "https://oauth2.googleapis.com/token"
        token_data = {
            'code': code,
            'client_id': settings.GOOGLE_CLIENT_ID,
            'client_secret': settings.GOOGLE_CLIENT_SECRET,
            'redirect_uri': settings.GOOGLE_REDIRECT_URI,
            'grant_type': 'authorization_code',
        }

        token_res = requests.post(token_endpoint, data=token_data)
        if token_res.status_code != 200:
            print(token_res.text)
            return Response({'error': 'Failed to fetch tokens from Google'}, status=status.HTTP_400_BAD_REQUEST)

        tokens = token_res.json()
        access_token = tokens.get('access_token')

        user_info_res = requests.get(
            'https://www.googleapis.com/oauth2/v2/userinfo',
            headers={'Authorization': f'Bearer {access_token}'}
        )
        if user_info_res.status_code != 200:
            return Response({'error': 'Failed to fetch user data from Google'}, status=status.HTTP_400_BAD_REQUEST)

        user_info = user_info_res.json()
        email = user_info.get('email')

        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'username': email,
                'first_name': user_info.get('given_name', ''),
                'last_name': user_info.get('family_name', '')
            }
        )
        if created:
            user.set_unusable_password()
            user.save()

        refresh = RefreshToken.for_user(user)
        access = AccessToken.for_user(user)
        return Response({
            'access': str(access),
            'refresh': str(refresh)
        }, status=status.HTTP_200_OK)
