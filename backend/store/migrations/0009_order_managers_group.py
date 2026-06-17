from django.db import migrations

ORDER_MANAGER_GROUP = "Order Managers"


def create_group(apps, schema_editor):
    Group = apps.get_model("auth", "Group")
    Group.objects.get_or_create(name=ORDER_MANAGER_GROUP)


def remove_group(apps, schema_editor):
    Group = apps.get_model("auth", "Group")
    Group.objects.filter(name=ORDER_MANAGER_GROUP).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("store", "0008_order_esewa_signature_order_pidx_and_more"),
        ("auth", "0012_alter_user_first_name_max_length"),
    ]

    operations = [
        migrations.RunPython(create_group, remove_group),
    ]
