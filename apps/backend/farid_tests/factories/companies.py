import uuid
from companies.models import Company


class CompanyFactory:
    @staticmethod
    def create(name: str | None = None):
        if name is None:
            name = f"Company-{uuid.uuid4().hex[:8]}"
        return Company.objects.create(name=name)
