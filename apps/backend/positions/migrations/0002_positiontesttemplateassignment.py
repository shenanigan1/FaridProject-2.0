from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0001_initial"),
        ("templates_grid", "0004_template_difficulty_template_duration_minutes_and_more"),
        ("positions", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="PositionTestTemplateAssignment",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("order", models.PositiveIntegerField(default=0)),
                (
                    "manager",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="managed_template_assignments",
                        to="users.user",
                    ),
                ),
                (
                    "position",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="test_template_assignments",
                        to="positions.position",
                    ),
                ),
                (
                    "template",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="position_assignments",
                        to="templates_grid.template",
                    ),
                ),
            ],
            options={
                "indexes": [
                    models.Index(fields=["position", "order"], name="positions_po_57c7f0_idx"),
                    models.Index(fields=["manager"], name="positions_ma_38c84f_idx"),
                ],
                "constraints": [
                    models.UniqueConstraint(
                        fields=("position", "template"),
                        name="uniq_position_template_assignment",
                    )
                ],
            },
        ),
    ]
