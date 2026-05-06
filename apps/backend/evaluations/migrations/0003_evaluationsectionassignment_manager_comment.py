from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("evaluations", "0002_evaluationresponse"),
    ]

    operations = [
        migrations.AddField(
            model_name="evaluationsectionassignment",
            name="manager_comment",
            field=models.TextField(blank=True, default=""),
        ),
    ]
