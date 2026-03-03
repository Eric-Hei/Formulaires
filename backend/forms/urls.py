from django.urls import path
from .views import FormSettingsView, FormResponseListView, FormStatsView

urlpatterns = [
    path("forms/<str:document_id>/settings/", FormSettingsView.as_view(), name="form-settings"),
    path("forms/<str:document_id>/responses/", FormResponseListView.as_view(), name="form-responses"),
    path("forms/<str:document_id>/stats/", FormStatsView.as_view(), name="form-stats"),
]
