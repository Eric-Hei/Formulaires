import requests
from django.conf import settings
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed

DEV_MOCK_USER = {
    "id": "dev-user-001",
    "sub": "dev-user-001",
    "email": "dev@localhost",
    "full_name": "Dev User",
}


class DocsUser:
    def __init__(self, user_data: dict):
        self.id = user_data.get("id") or user_data.get("sub", "")
        self.email = user_data.get("email", "")
        self.full_name = user_data.get("full_name", "")
        self.is_authenticated = True

    def __str__(self):
        return self.email or self.id


class DocsTokenAuthentication(BaseAuthentication):
    keyword = "Bearer"

    def authenticate(self, request):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith(f"{self.keyword} "):
            return None

        token = auth_header[len(f"{self.keyword} "):]
        if not token:
            return None

        # ── Dev bypass ──────────────────────────────────────────────────────
        # Active uniquement si DEBUG=True ET DEV_BYPASS_TOKEN est défini.
        # Ne jamais activer en production (DEBUG doit être False).
        bypass_token = getattr(settings, "DEV_BYPASS_TOKEN", None)
        if settings.DEBUG and bypass_token and token == bypass_token:
            return (DocsUser(DEV_MOCK_USER), token)
        # ────────────────────────────────────────────────────────────────────

        user_data = self._verify_token_with_docs(token)
        if user_data is None:
            raise AuthenticationFailed("Invalid or expired token.")

        return (DocsUser(user_data), token)

    def _verify_token_with_docs(self, token: str):
        try:
            response = requests.get(
                f"{settings.DOCS_API_URL}/users/me/",
                headers={"Authorization": f"Bearer {token}"},
                timeout=5,
            )
            if response.status_code == 200:
                return response.json()
        except requests.RequestException:
            pass
        return None
