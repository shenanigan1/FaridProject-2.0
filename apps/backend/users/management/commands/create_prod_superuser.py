import os

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Create production superuser if it does not exist."

    def handle(self, *args, **options):
        User = get_user_model()

        email = os.getenv("DJANGO_SUPERUSER_EMAIL")
        password = os.getenv("DJANGO_SUPERUSER_PASSWORD")

        if not email or not password:
            self.stdout.write(
                self.style.WARNING("Superuser env vars are missing. Skipped.")
            )
            return

        if User.objects.filter(email=email).exists():
            self.stdout.write("Superuser already exists. Skipped.")
            return

        User.objects.create_superuser(
            email=email,
            password=password,
        )

        self.stdout.write(self.style.SUCCESS("Superuser created."))