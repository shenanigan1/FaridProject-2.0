from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("templates_grid", "0001_initial"),
        ("recruitment", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="jobapplication",
            name="assigned_template",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="job_applications",
                to="templates_grid.template",
            ),
        ),
    ]
