from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.contrib.auth.tokens import PasswordResetTokenGenerator

from .utils.tokens import EmailVerificationTokenGenerator


def _send(subject, template, context, to_email):
    html_message = render_to_string(template, context)
    send_mail(
        subject,
        strip_tags(html_message),
        settings.DEFAULT_FROM_EMAIL,
        [to_email],
        html_message=html_message,
        fail_silently=False,
    )


def send_welcome_email(user):
    _send(
        "Welcome to Store",
        "emails/welcome.html",
        {"user": user},
        user.email,
    )


def send_verification_email(user):
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = EmailVerificationTokenGenerator().make_token(user)
    link = f"{settings.FRONTEND_URL}/verify-email/{uid}/{token}/"
    _send(
        "Verify your email address",
        "emails/verify_email.html",
        {"user": user, "link": link},
        user.email,
    )


def send_password_reset_email(user):
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = PasswordResetTokenGenerator().make_token(user)
    link = f"{settings.FRONTEND_URL}/reset-password/{uid}/{token}/"
    _send(
        "Reset your password",
        "emails/password_reset.html",
        {"user": user, "link": link},
        user.email,
    )


def send_order_confirmation(order):
    _send(
        "Order confirmation",
        "emails/order_confirmation.html",
        {"order": order},
        order.user.email,
    )
