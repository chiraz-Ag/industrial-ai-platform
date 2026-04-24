import httpx
from app.config import settings

class SupabaseClient:
    def __init__(self):
        self.url = settings.supabase_url
        self.key = settings.supabase_key
        self.headers = {
            "apikey": self.key,
            "Authorization": f"Bearer {self.key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        }

    def get_client(self):
        return httpx.AsyncClient(
            base_url=f"{self.url}",
            headers=self.headers,
            timeout=30.0
        )

supabase = SupabaseClient()