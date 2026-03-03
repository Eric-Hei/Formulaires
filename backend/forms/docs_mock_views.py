"""
Mock de l'API docs — actif uniquement en mode DEBUG.

Expose les endpoints attendus par le frontend :
  GET/POST  /api/v1.0/documents/
  GET/PATCH/DELETE /api/v1.0/documents/<uuid>/
  GET  /api/v1.0/users/me/
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny

from forms.authentication import DocsTokenAuthentication, DEV_MOCK_USER
from forms.models import MockDocument


def _serialize_doc(doc) -> dict:
    return {
        "id": str(doc.id),
        "title": doc.title,
        "content": doc.content,
        "created_at": doc.created_at.isoformat(),
        "updated_at": doc.updated_at.isoformat(),
        "abilities": {
            "destroy": True,
            "manage": True,
            "update": True,
            "retrieve": True,
        },
    }


class UserMeView(APIView):
    authentication_classes = [DocsTokenAuthentication]
    permission_classes = [AllowAny]

    def get(self, request):
        if request.user and request.user.is_authenticated:
            return Response({
                "id": request.user.id,
                "email": request.user.email,
                "full_name": request.user.full_name,
            })
        return Response(DEV_MOCK_USER)


class DocumentListView(APIView):
    authentication_classes = [DocsTokenAuthentication]
    permission_classes = [AllowAny]

    def get(self, request):
        if not (request.user and request.user.is_authenticated):
            return Response({"count": 0, "results": []})
        docs = MockDocument.objects.filter(owner_id=request.user.id)
        results = [_serialize_doc(d) for d in docs]
        return Response({"count": len(results), "results": results})

    def post(self, request):
        if not (request.user and request.user.is_authenticated):
            return Response({"detail": "Authentication required."}, status=status.HTTP_401_UNAUTHORIZED)
        doc = MockDocument.objects.create(
            title=request.data.get("title", "Sans titre"),
            content=request.data.get("content", []),
            owner_id=request.user.id,
        )
        return Response(_serialize_doc(doc), status=status.HTTP_201_CREATED)


class DocumentDetailView(APIView):
    authentication_classes = [DocsTokenAuthentication]
    permission_classes = [AllowAny]

    def _get_doc(self, pk, user):
        try:
            return MockDocument.objects.get(id=pk, owner_id=user.id)
        except MockDocument.DoesNotExist:
            return None

    def get(self, request, pk):
        doc = self._get_doc(pk, request.user)
        if doc is None:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(_serialize_doc(doc))

    def patch(self, request, pk):
        doc = self._get_doc(pk, request.user)
        if doc is None:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        if "title" in request.data:
            doc.title = request.data["title"]
        if "content" in request.data:
            doc.content = request.data["content"]
        doc.save()
        return Response(_serialize_doc(doc))

    def delete(self, request, pk):
        doc = self._get_doc(pk, request.user)
        if doc is None:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        doc.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

