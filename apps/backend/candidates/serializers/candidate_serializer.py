from rest_framework import serializers

from candidates.models import Candidate

MODEL_FIELD_NAMES = {
    field.name
    for field in Candidate._meta.get_fields()
    if getattr(field, "concrete", False)
}

BASE_FIELDS = [
    "id",
    "first_name",
    "last_name",
    "email",
    "phone",
    "status",
    "flag",
    "target_position_id",
]

SERIALIZER_FIELDS = [field for field in BASE_FIELDS if field in MODEL_FIELD_NAMES]

REQUIRED_FIELD_RULES = {
    "first_name": {"required": True},
    "last_name": {"required": True},
    "email": {"required": True},
}


class CandidateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Candidate
        fields = SERIALIZER_FIELDS
        extra_kwargs = {
            key: value
            for key, value in REQUIRED_FIELD_RULES.items()
            if key in SERIALIZER_FIELDS
        }
