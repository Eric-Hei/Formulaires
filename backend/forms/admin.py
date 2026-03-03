from django.contrib import admin
from .models import FormSettings, FormResponse


@admin.register(FormSettings)
class FormSettingsAdmin(admin.ModelAdmin):
    list_display = ["document_id", "owner_id", "is_open", "response_count", "created_at"]
    list_filter = ["is_open"]
    search_fields = ["document_id", "owner_id"]
    readonly_fields = ["created_at", "updated_at"]


@admin.register(FormResponse)
class FormResponseAdmin(admin.ModelAdmin):
    list_display = ["id", "form", "submitted_at", "respondent_id", "ip_address"]
    list_filter = ["form"]
    search_fields = ["respondent_id", "ip_address"]
    readonly_fields = ["submitted_at"]
