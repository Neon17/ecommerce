"""Backfill the marketplace data after migrating to multi-vendor.

What it does (idempotent — safe to run more than once):
  1. Creates a default "Legacy Shop" (and a user to own it).
  2. Assigns every product that has no shop to the Legacy Shop.
  3. For every old order whose items aren't linked to a SubOrder yet, creates
     SubOrders (grouped by each item's product.shop) and links the items.

Run it once, right after `migrate`:
    python manage.py seed_legacy_shop
"""
from collections import defaultdict

from django.contrib.auth.models import User
from django.core.management.base import BaseCommand
from django.db import transaction

from store.models import Shop, Product, Order, SubOrder


class Command(BaseCommand):
    help = "Create a default Legacy Shop and assign existing products/orders to it."

    def add_arguments(self, parser):
        parser.add_argument("--name", default="Legacy Shop")
        parser.add_argument("--slug", default="legacy")
        parser.add_argument("--owner-username", default="legacy_shop_owner")

    @transaction.atomic
    def handle(self, *args, **options):
        name = options["name"]
        slug = options["slug"]
        owner_username = options["owner_username"]

        # 1) A user to own the legacy shop. A dedicated user avoids clashing with
        #    the OneToOne owner of any real shop you create later.
        owner, _ = User.objects.get_or_create(
            username=owner_username,
            defaults={"email": "legacy@example.com", "is_active": True},
        )

        # 2) The legacy shop itself (looked up by slug so re-runs don't duplicate).
        shop, created = Shop.objects.get_or_create(
            slug=slug, defaults={"name": name, "owner": owner}
        )
        self.stdout.write(
            self.style.SUCCESS(f"{'Created' if created else 'Found'} shop '{shop.name}' (slug={shop.slug}).")
        )

        # 3) Adopt every product that has no shop yet.
        adopted = Product.objects.filter(shop__isnull=True).update(shop=shop)
        self.stdout.write(self.style.SUCCESS(f"Assigned {adopted} product(s) to '{shop.name}'."))

        # 4) Rebuild SubOrders for legacy orders whose items aren't linked yet.
        sub_orders_made = 0
        items_linked = 0
        # Only touch orders that still have un-linked items.
        orders = Order.objects.filter(items__sub_order__isnull=True).distinct()
        for order in orders:
            unlinked = list(
                order.items.select_related("product", "product__shop").filter(sub_order__isnull=True)
            )
            if not unlinked:
                continue

            # Group this order's items by the shop of each product.
            by_shop = defaultdict(list)
            for item in unlinked:
                by_shop[item.product.shop].append(item)

            for item_shop, shop_items in by_shop.items():
                # Reuse a SubOrder if this order already has one for this shop.
                sub_order, made = SubOrder.objects.get_or_create(
                    order=order, shop=item_shop, defaults={"status": order.status or "pending"}
                )
                if made:
                    sub_orders_made += 1

                subtotal = sub_order.subtotal
                for item in shop_items:
                    item.sub_order = sub_order
                    item.save(update_fields=["sub_order"])
                    subtotal += item.price * item.quantity
                    items_linked += 1

                sub_order.subtotal = subtotal
                sub_order.save(update_fields=["subtotal"])

        self.stdout.write(
            self.style.SUCCESS(
                f"Created {sub_orders_made} SubOrder(s) and linked {items_linked} order item(s)."
            )
        )
        self.stdout.write(self.style.SUCCESS("Done. Legacy data backfilled."))
