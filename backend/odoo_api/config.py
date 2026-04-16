from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class Settings:
    odoo_host: str
    odoo_db: str
    odoo_username: str
    odoo_password: str


def _load_env_file(path: Path) -> None:
    if not path.exists():
        return

    for line in path.read_text(encoding="utf-8").splitlines():
        raw = line.strip()
        if not raw or raw.startswith("#") or "=" not in raw:
            continue
        key, value = raw.split("=", 1)
        key = key.strip()
        if key:
            os.environ.setdefault(key, value.strip())


def load_settings() -> Settings:
    backend_dir = Path(__file__).resolve().parents[1]
    root_dir = backend_dir.parent

    _load_env_file(root_dir / ".env.local")
    _load_env_file(root_dir / "workspace" / ".env.local")

    host = (os.getenv("ODOO_HOST") or "").rstrip("/")
    db = os.getenv("ODOO_DB") or ""
    user = os.getenv("ODOO_USERNAME") or ""
    password = os.getenv("ODOO_PASSWORD") or ""

    missing = [
        name
        for name, value in [
            ("ODOO_HOST", host),
            ("ODOO_DB", db),
            ("ODOO_USERNAME", user),
            ("ODOO_PASSWORD", password),
        ]
        if not value
    ]
    if missing:
        raise RuntimeError(f"Missing required env vars: {', '.join(missing)}")

    return Settings(
        odoo_host=host,
        odoo_db=db,
        odoo_username=user,
        odoo_password=password,
    )
