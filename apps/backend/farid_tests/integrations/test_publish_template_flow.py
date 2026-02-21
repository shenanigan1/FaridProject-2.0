import pytest
from templates_grid.models import (
    TemplateVersion, VersionedPool, VersionedQuestion, TemplatePool
)
from farid_tests.factories.templates import TemplateFactory, QuestionPoolFactory, SkillQuestionFactory


@pytest.mark.django_db
def test_publish_template_creates_snapshot_versioned_entities():
    """
    This test assumes you will implement a function like:
    templates_grid.services.publish_template(template_id, actor_id) -> TemplateVersion
    For now, we simulate expected DB outcome by manually creating the snapshot.
    Later, replace manual snapshot creation with the real service call.
    """
    tpl = TemplateFactory(status="draft")
    pool1 = QuestionPoolFactory(code="soft_pool")
    pool2 = QuestionPoolFactory(code="hard_pool")

    # Link pools to template with order
    TemplatePool.objects.create(template=tpl, pool=pool1, order=1)
    TemplatePool.objects.create(template=tpl, pool=pool2, order=2)

    # Questions
    q1 = SkillQuestionFactory(pool=pool1, label="Communication", type="soft", min_score=0, max_score=5, weight=1)
    q2 = SkillQuestionFactory(pool=pool2, label="Django", type="hard", min_score=0, max_score=5, weight=2)

    # --- Simulate publish output (replace with service later) ---
    tpl.status = "published"
    tpl.save()

    v = TemplateVersion.objects.create(template=tpl, version=1)

    vp1 = VersionedPool.objects.create(template_version=v, name=pool1.name, code=pool1.code, description=pool1.description, order=1)
    vp2 = VersionedPool.objects.create(template_version=v, name=pool2.name, code=pool2.code, description=pool2.description, order=2)

    VersionedQuestion.objects.create(
        versioned_pool=vp1, label=q1.label, type=q1.type, min_score=q1.min_score, max_score=q1.max_score, weight=q1.weight, order=1
    )
    VersionedQuestion.objects.create(
        versioned_pool=vp2, label=q2.label, type=q2.type, min_score=q2.min_score, max_score=q2.max_score, weight=q2.weight, order=1
    )
    # ----------------------------------------------------------

    assert TemplateVersion.objects.filter(template=tpl).count() == 1
    assert VersionedPool.objects.filter(template_version=v).count() == 2
    assert VersionedQuestion.objects.filter(versioned_pool__template_version=v).count() == 2