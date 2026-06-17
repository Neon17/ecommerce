from django.contrib.auth.models import Group, User
from django.core.management.base import BaseCommand

from store.permissions import ORDER_MANAGER_GROUP


class Command(BaseCommand):
    help = "Seed an Order Manager user and ensure the 'Order Managers' group exists."

    def add_arguments(self, parser):
        parser.add_argument("--username", default="ordermanager")
        parser.add_argument("--email", default="ordermanager@example.com")
        parser.add_argument("--password", default="password")

    def handle(self, *args, **options):
        username = options["username"]
        email = options["email"]
        password = options["password"]

        group, _ = Group.objects.get_or_create(name=ORDER_MANAGER_GROUP)

        user, created = User.objects.get_or_create(
            username=username,
            defaults={"email": email},
        )
        # Always (re)set the password and email so the command is reliably repeatable.
        user.email = email
        user.set_password(password)
        user.is_active = True
        user.save()

        user.groups.add(group)

        action = "Created" if created else "Updated"
        self.stdout.write(
            self.style.SUCCESS(
                f"{action} user '{username}' (password: '{password}') "
                f"in group '{ORDER_MANAGER_GROUP}'."
            )
        )
