"""Configuration loader using Pydantic Settings (from .env)."""

from pathlib import Path
from typing import Optional

from pydantic_settings import BaseSettings


class Config(BaseSettings):
    """Codoo configuration from environment variables."""

    # Odoo Connection
    odoo_host: str = "https://marcorv.odoo.com"
    odoo_db: str = "fame_production"
    odoo_username: str = ""
    odoo_password: str = ""

    # LLM
    codoo_gemini_api_key: str = ""

    # Environment
    log_level: str = "INFO"
    evidence_dir: Path = Path("docs/logs")
    data_dir: Path = Path("workspace/data")

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False
        extra = "ignore"  # allow unknown env vars (e.g., BACKEND_HOST)

    def validate_odoo_credentials(self) -> bool:
        """Check if all required Odoo credentials are set."""
        return bool(
            self.odoo_host
            and self.odoo_db
            and self.odoo_username
            and self.odoo_password
        )


def load_config() -> Config:
    """Load configuration from environment."""
    return Config()
