import pytest
from django.urls import reverse

pytestmark = pytest.mark.django_db


@pytest.mark.parametrize(
    "route_name",
    [
        "companies-list",
        "employees-list",
        "questionpools-list",
        "skillquestions-list",
        "templates-list",
        "templatesections-list",
        "templatepoolrules-list",
    ],
)
def test_admin_api_viewsets_require_authentication_by_default(api_client, route_name):
    response = api_client.get(reverse(route_name))

    assert response.status_code == 401


def test_public_positions_remain_available_without_authentication(api_client):
    response = api_client.get(reverse("public-positions-list"))

    assert response.status_code == 200
