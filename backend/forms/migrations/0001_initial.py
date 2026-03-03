from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="FormSettings",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("document_id", models.CharField(db_index=True, max_length=255, unique=True)),
                ("owner_id", models.CharField(max_length=255)),
                ("is_open", models.BooleanField(default=True)),
                ("max_responses", models.PositiveIntegerField(blank=True, null=True)),
                ("close_date", models.DateTimeField(blank=True, null=True)),
                ("redirect_url", models.URLField(blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={"ordering": ["-created_at"], "verbose_name": "Form Settings", "verbose_name_plural": "Form Settings"},
        ),
        migrations.CreateModel(
            name="FormResponse",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("submitted_at", models.DateTimeField(auto_now_add=True)),
                ("respondent_id", models.CharField(blank=True, max_length=255)),
                ("answers", models.JSONField()),
                ("ip_address", models.GenericIPAddressField(blank=True, null=True)),
                ("user_agent", models.TextField(blank=True)),
                ("form", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="responses", to="forms.formsettings")),
            ],
            options={"ordering": ["-submitted_at"], "verbose_name": "Form Response", "verbose_name_plural": "Form Responses"},
        ),
    ]
