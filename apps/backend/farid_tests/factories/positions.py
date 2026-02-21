import factory
from positions.models import Position


class PositionFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Position

    title = factory.Sequence(lambda n: f"Position {n}")
    description = "Job description"
    department = "Engineering"
    contract_type = "other"
    external_company_id = 1
    location = "Bordeaux"
    salary = 45000
    is_active = True