from celery import shared_task
from django.contrib.auth.models import User

from . import services


@shared_task(bind=True, max_retries=3)
def send_welcome_email_task(self, user_id):
    try:
        services.send_welcome_email(User.objects.get(pk=user_id))
    except Exception as exc:
        self.retry(exc=exc, countdown=60)


@shared_task(bind=True, max_retries=3)
def send_verification_email_task(self, user_id):
    try:
        services.send_verification_email(User.objects.get(pk=user_id))
    except Exception as exc:
        self.retry(exc=exc, countdown=60)


@shared_task(bind=True, max_retries=3)
def send_password_reset_email_task(self, user_id):
    try:
        services.send_password_reset_email(User.objects.get(pk=user_id))
    except Exception as exc:
        self.retry(exc=exc, countdown=60)


@shared_task(bind=True, max_retries=3)
def send_order_confirmation_task(self, order_id):
    from .models import Order
    try:
        services.send_order_confirmation(Order.objects.get(pk=order_id))
    except Exception as exc:
        self.retry(exc=exc, countdown=60)
