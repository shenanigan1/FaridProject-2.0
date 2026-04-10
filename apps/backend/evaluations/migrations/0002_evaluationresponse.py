from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        (
            "templates_grid",
            "0004_template_difficulty_template_duration_minutes_and_more",
        ),
        ("evaluations", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="EvaluationResponse",
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
                ("candidate_answer", models.TextField(blank=True, default="")),
                ("manager_comment", models.TextField(blank=True, default="")),
                ("score", models.IntegerField(blank=True, null=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "evaluation",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="responses",
                        to="evaluations.evaluation",
                    ),
                ),
                (
                    "question",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="evaluation_responses",
                        to="templates_grid.skillquestion",
                    ),
                ),
            ],
            options={
                "indexes": [
                    models.Index(
                        fields=["evaluation", "updated_at"],
                        name="evaluation_evaluat_1746fc_idx",
                    ),
                ],
                "constraints": [
                    models.UniqueConstraint(
                        fields=("evaluation", "question"),
                        name="uniq_evaluation_response_question",
                    )
                ],
            },
        ),
    ]
