from rest_framework import serializers
from .models import FormSettings, FormResponse


class FormSettingsSerializer(serializers.ModelSerializer):
    response_count = serializers.ReadOnlyField()
    is_accepting_responses = serializers.SerializerMethodField()

    class Meta:
        model = FormSettings
        fields = [
            "document_id",
            "owner_id",
            "is_open",
            "max_responses",
            "close_date",
            "redirect_url",
            "created_at",
            "updated_at",
            "response_count",
            "is_accepting_responses",
        ]
        read_only_fields = ["document_id", "owner_id", "created_at", "updated_at"]

    def get_is_accepting_responses(self, obj):
        return obj.is_accepting_responses()


class FormResponseSerializer(serializers.ModelSerializer):
    class Meta:
        model = FormResponse
        fields = [
            "id",
            "submitted_at",
            "respondent_id",
            "answers",
            "ip_address",
        ]
        read_only_fields = ["id", "submitted_at", "ip_address"]


class FormResponseCreateSerializer(serializers.Serializer):
    answers = serializers.JSONField()
    respondent_id = serializers.CharField(required=False, allow_blank=True, default="")


class FormStatsSerializer(serializers.Serializer):
    document_id = serializers.CharField()
    total_responses = serializers.IntegerField()
    is_accepting = serializers.BooleanField()
    field_stats = serializers.DictField()
