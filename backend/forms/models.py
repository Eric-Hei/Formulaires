import uuid

from django.db import models


class FormSettings(models.Model):
    document_id = models.CharField(max_length=255, unique=True, db_index=True)
    owner_id = models.CharField(max_length=255)
    is_open = models.BooleanField(default=True)
    max_responses = models.PositiveIntegerField(null=True, blank=True)
    close_date = models.DateTimeField(null=True, blank=True)
    redirect_url = models.URLField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Form Settings"
        verbose_name_plural = "Form Settings"

    def __str__(self):
        return f"Form {self.document_id}"

    @property
    def response_count(self):
        return self.responses.count()

    def is_accepting_responses(self):
        from django.utils import timezone

        if not self.is_open:
            return False
        if self.close_date and self.close_date < timezone.now():
            return False
        if self.max_responses and self.response_count >= self.max_responses:
            return False
        return True


class FormResponse(models.Model):
    form = models.ForeignKey(
        FormSettings, on_delete=models.CASCADE, related_name="responses"
    )
    submitted_at = models.DateTimeField(auto_now_add=True)
    respondent_id = models.CharField(max_length=255, blank=True)
    answers = models.JSONField()
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)

    class Meta:
        ordering = ["-submitted_at"]
        verbose_name = "Form Response"
        verbose_name_plural = "Form Responses"

    def __str__(self):
        return f"Response {self.pk} for form {self.form.document_id}"


class MockDocument(models.Model):
    """Document stocké localement pour le dev (remplace l'API docs upstream)."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=500, default="Sans titre")
    content = models.JSONField(default=list)
    owner_id = models.CharField(max_length=255, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]
        verbose_name = "Mock Document"
        verbose_name_plural = "Mock Documents"

    def __str__(self):
        return f"{self.title} ({self.id})"
