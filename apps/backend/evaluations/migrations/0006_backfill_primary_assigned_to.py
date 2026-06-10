from django.db import migrations


def backfill_primary_assigned_to(apps, schema_editor):
    Evaluation = apps.get_model("evaluations", "Evaluation")
    EvaluationSectionAssignment = apps.get_model(
        "evaluations", "EvaluationSectionAssignment"
    )

    evaluations = Evaluation.objects.filter(
        assigned_to__isnull=True,
        section_assignments__isnull=False,
    ).distinct()

    for evaluation in evaluations.iterator():
        assignment = (
            EvaluationSectionAssignment.objects.filter(evaluation_id=evaluation.id)
            .order_by("id")
            .first()
        )
        if assignment is None:
            continue
        evaluation.assigned_to_id = assignment.assigned_to_id
        evaluation.save(update_fields=["assigned_to"])


class Migration(migrations.Migration):
    dependencies = [
        ("evaluations", "0005_add_rejected_evaluation_status"),
    ]

    operations = [
        migrations.RunPython(backfill_primary_assigned_to, migrations.RunPython.noop),
    ]
