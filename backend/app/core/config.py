"""
CodeMind — Application Configuration

Uses pydantic-settings to load configuration from environment variables.
All sensitive values default to empty strings and MUST be set in .env.
"""

from functools import lru_cache
from typing import List

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # --- General ---
    app_name: str = "CodeMind"
    app_env: str = "development"
    debug: bool = True

    # --- Backend ---
    backend_host: str = "0.0.0.0"
    backend_port: int = 8000
    backend_cors_origins: List[str] = ["http://localhost:3000"]

    # --- Database ---
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/codemind"
    database_url_sync: str = "postgresql://postgres:postgres@localhost:5432/codemind"

    # --- Redis ---
    redis_url: str = "redis://localhost:6379/0"

    # --- JWT ---
    jwt_secret_key: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 30
    jwt_refresh_token_expire_days: int = 7

    # --- GitHub OAuth ---
    github_client_id: str = ""
    github_client_secret: str = ""
    github_redirect_uri: str = "http://localhost:3000/api/auth/github/callback"

    # --- Google Gemini ---
    google_api_key: str = ""

    # --- ChromaDB ---
    chroma_host: str = "localhost"
    chroma_port: int = 8100

    # --- Encryption ---
    encryption_key: str = ""

    @field_validator("backend_cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: str | List[str]) -> List[str]:
        """Parse CORS origins from a JSON string or return list as-is."""
        if isinstance(v, str):
            import json
            return json.loads(v)
        return v

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"


@lru_cache()
def get_settings() -> Settings:
    """Cached settings singleton. Call this instead of instantiating Settings directly."""
    return Settings()
