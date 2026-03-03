from django.conf import settings
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("forms.urls")),
]

# ── Mock API docs (dev uniquement) ───────────────────────────────────────────
# Expose /api/v1.0/documents/ et /api/v1.0/users/me/ en remplacement de docs.
# Inactif si DEBUG=False.
if settings.DEBUG:
    from forms.docs_mock_views import DocumentListView, DocumentDetailView, UserMeView

    urlpatterns += [
        path("api/v1.0/users/me/", UserMeView.as_view()),
        path("api/v1.0/documents/", DocumentListView.as_view()),
        path("api/v1.0/documents/<uuid:pk>/", DocumentDetailView.as_view()),
    ]

