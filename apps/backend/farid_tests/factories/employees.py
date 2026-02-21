import factory
from employees.models import Employee


class EmployeeFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Employee

    employee_number = factory.Sequence(lambda n: f"EMP-{n:05d}")
    first_name = "Bob"
    last_name = factory.Sequence(lambda n: f"Employee{n}")
    email = factory.Sequence(lambda n: f"employee{n}@example.com")
    department = "Operations"