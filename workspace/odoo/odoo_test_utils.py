from __future__ import annotations

import os
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
import xmlrpc.client


def load_env(workspace_root: Path, project_root: Path) -> Path:
    candidates = [
        project_root / ".env.local",
        workspace_root / ".env.local",
    ]

    for env_path in candidates:
        if env_path.exists():
            for line in env_path.read_text(encoding="utf-8").splitlines():
                raw = line.strip()
                if not raw or raw.startswith("#") or "=" not in raw:
                    continue
                key, value = raw.split("=", 1)
                key = key.strip()
                if key:
                    os.environ[key] = value.strip()
            return env_path

    raise FileNotFoundError("No .env.local found in project root or workspace root")


def get_odoo_credentials() -> Tuple[str, str, str, str]:
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

    return host, db, user, password


class OdooClient:
    def __init__(self, host: str, db: str, user: str, password: str):
        self.host = host
        self.db = db
        self.user = user
        self.password = password
        self.common = xmlrpc.client.ServerProxy(f"{host}/xmlrpc/2/common")
        self.models = xmlrpc.client.ServerProxy(f"{host}/xmlrpc/2/object")
        self.uid: Optional[int] = None

    def authenticate(self) -> int:
        uid_raw = self.common.authenticate(self.db, self.user, self.password, {})
        if not uid_raw:
            raise RuntimeError("Authentication failed")
        if not isinstance(uid_raw, (int, float, str, bytes, bytearray)):
            raise RuntimeError(f"Unexpected uid type: {type(uid_raw).__name__}")
        self.uid = int(uid_raw)
        return self.uid

    def version(self) -> Dict[str, Any]:
        payload = self.common.version()
        if isinstance(payload, dict):
            return payload
        return {}

    def execute(
        self,
        model: str,
        method: str,
        args: Optional[List[Any]] = None,
        kwargs: Optional[Dict[str, Any]] = None,
    ) -> Any:
        if self.uid is None:
            raise RuntimeError("Client is not authenticated")
        return self.models.execute_kw(
            self.db,
            self.uid,
            self.password,
            model,
            method,
            args or [],
            kwargs or {},
        )
