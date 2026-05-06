from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        (
            "templates_grid",
            "0004_template_difficulty_template_duration_minutes_and_more",
        ),
    ]

    operations = [
        migrations.AlterField(
            model_name="skillquestion",
            name="format",
            field=models.CharField(
                choices=[
                    ("mcq", "Multiple Choice"),
                    ("true_false", "True/False"),
                    ("yes_no", "Yes/No"),
                    ("free_text", "Free text"),
                    ("rating", "Rating"),
                    ("practical", "Practical"),
                ],
                default="mcq",
                max_length=20,
            ),
        ),
    ]
