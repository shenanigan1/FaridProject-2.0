from dataclasses import dataclass

from positions.models import Position
from templates_grid.models import Template


@dataclass
class AssociateTemplateResult:
    ok: bool
    status_code: int
    payload: dict


def associate_template_to_position(*, position: Position, template_id: int | None) -> AssociateTemplateResult:
    if not template_id:
        return AssociateTemplateResult(
            ok=False,
            status_code=400,
            payload={"template_id": ["This field is required."]},
        )

    try:
        template = Template.objects.get(id=template_id)
    except Template.DoesNotExist:
        return AssociateTemplateResult(
            ok=False,
            status_code=404,
            payload={"template_id": ["Template not found."]},
        )

    position.templates.add(template)

    return AssociateTemplateResult(
        ok=True,
        status_code=200,
        payload={"status": "template associated"},
    )
