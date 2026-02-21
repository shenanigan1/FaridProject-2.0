import factory
from candidates.models import Candidate


class CandidateFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Candidate

    first_name = "Alice"
    last_name = factory.Sequence(lambda n: f"Candidate{n}")
    email = factory.Sequence(lambda n: f"candidate{n}@example.com")
    phone = "0600000000"
    status = "pending"