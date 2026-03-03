from collections import Counter
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import FormSettings, FormResponse
from .serializers import (
    FormSettingsSerializer,
    FormResponseSerializer,
    FormResponseCreateSerializer,
)


def get_client_ip(request):
    x_forwarded = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded:
        return x_forwarded.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")


class FormSettingsView(APIView):
    def get_permissions(self):
        if self.request.method == "GET":
            return []
        return [IsAuthenticated()]

    def get(self, request, document_id):
        try:
            settings_obj = FormSettings.objects.get(document_id=document_id)
        except FormSettings.DoesNotExist:
            return Response(
                {"document_id": document_id, "is_open": True, "is_accepting_responses": True},
                status=status.HTTP_200_OK,
            )
        serializer = FormSettingsSerializer(settings_obj)
        return Response(serializer.data)

    def put(self, request, document_id):
        try:
            settings_obj = FormSettings.objects.get(document_id=document_id)
            if settings_obj.owner_id != request.user.id:
                return Response(status=status.HTTP_403_FORBIDDEN)
        except FormSettings.DoesNotExist:
            settings_obj = FormSettings(
                document_id=document_id,
                owner_id=request.user.id,
            )

        serializer = FormSettingsSerializer(settings_obj, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def post(self, request, document_id):
        if FormSettings.objects.filter(document_id=document_id).exists():
            return Response(
                {"detail": "Form settings already exist. Use PUT to update."},
                status=status.HTTP_409_CONFLICT,
            )
        settings_obj = FormSettings(document_id=document_id, owner_id=request.user.id)
        serializer = FormSettingsSerializer(settings_obj, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class FormResponseListView(APIView):
    def get_permissions(self):
        if self.request.method == "POST":
            return []
        return [IsAuthenticated()]

    def post(self, request, document_id):
        try:
            form = FormSettings.objects.get(document_id=document_id)
        except FormSettings.DoesNotExist:
            form = FormSettings.objects.create(
                document_id=document_id,
                owner_id="",
            )

        if not form.is_accepting_responses():
            return Response(
                {"detail": "This form is not currently accepting responses."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = FormResponseCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        FormResponse.objects.create(
            form=form,
            answers=serializer.validated_data["answers"],
            respondent_id=serializer.validated_data.get("respondent_id", ""),
            ip_address=get_client_ip(request),
            user_agent=request.META.get("HTTP_USER_AGENT", "")[:500],
        )

        redirect_url = form.redirect_url or None
        return Response(
            {"detail": "Response submitted successfully.", "redirect_url": redirect_url},
            status=status.HTTP_201_CREATED,
        )

    def get(self, request, document_id):
        form = get_object_or_404(FormSettings, document_id=document_id)
        if form.owner_id != request.user.id:
            return Response(status=status.HTTP_403_FORBIDDEN)

        responses = form.responses.all()
        serializer = FormResponseSerializer(responses, many=True)
        return Response(
            {
                "count": responses.count(),
                "results": serializer.data,
            }
        )


class FormStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, document_id):
        form = get_object_or_404(FormSettings, document_id=document_id)
        if form.owner_id != request.user.id:
            return Response(status=status.HTTP_403_FORBIDDEN)

        responses = list(form.responses.values_list("answers", flat=True))
        total = len(responses)

        field_stats = {}
        for response_answers in responses:
            if not isinstance(response_answers, dict):
                continue
            for block_id, value in response_answers.items():
                if block_id not in field_stats:
                    field_stats[block_id] = []
                field_stats[block_id].append(value)

        aggregated = {}
        for block_id, values in field_stats.items():
            flat_values = []
            for v in values:
                if isinstance(v, list):
                    flat_values.extend(v)
                else:
                    flat_values.append(str(v))
            aggregated[block_id] = {
                "count": len(values),
                "distribution": dict(Counter(flat_values).most_common(20)),
            }

        return Response(
            {
                "document_id": document_id,
                "total_responses": total,
                "is_accepting": form.is_accepting_responses(),
                "field_stats": aggregated,
            }
        )
