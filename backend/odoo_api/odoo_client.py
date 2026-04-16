from __future__ import annotations

import re
import xmlrpc.client
from typing import Any

from .config import Settings

_MODEL_NAME_RE = re.compile(r"^[a-z0-9_.]+$")


class OdooXmlRpcError(RuntimeError):
    pass


class OdooClient:
    def __init__(self, settings: Settings):
        self._settings = settings
        self._common = xmlrpc.client.ServerProxy(f"{settings.odoo_host}/xmlrpc/2/common")
        self._models = xmlrpc.client.ServerProxy(f"{settings.odoo_host}/xmlrpc/2/object")
        self._uid: int | None = None

    @property
    def uid(self) -> int:
        if self._uid is None:
            self.authenticate()
        return int(self._uid)

    def authenticate(self) -> int:
        uid = self._common.authenticate(
            self._settings.odoo_db,
            self._settings.odoo_username,
            self._settings.odoo_password,
            {},
        )
        if not uid:
            raise OdooXmlRpcError("Authentication failed")
        self._uid = int(uid)
        return self._uid

    def version(self) -> dict[str, Any]:
        payload = self._common.version()
        return payload if isinstance(payload, dict) else {}

    def _ensure_model_name(self, model: str) -> str:
        normalized = model.strip().lower()
        if not normalized or not _MODEL_NAME_RE.match(normalized):
            raise OdooXmlRpcError("Invalid model name")
        return normalized

    def execute_kw(self, model: str, method: str, args: list[Any] | None = None, kwargs: dict[str, Any] | None = None) -> Any:
        safe_model = self._ensure_model_name(model)
        safe_method = method.strip()
        if not safe_method:
            raise OdooXmlRpcError("Method is required")

        try:
            return self._models.execute_kw(
                self._settings.odoo_db,
                self.uid,
                self._settings.odoo_password,
                safe_model,
                safe_method,
                args or [],
                kwargs or {},
            )
        except xmlrpc.client.Fault as exc:
            raise OdooXmlRpcError(f"Fault {exc.faultCode}: {exc.faultString}") from exc
        except Exception as exc:
            raise OdooXmlRpcError(str(exc)) from exc

    def search_read(self, model: str, domain: list[Any], fields: list[str], offset: int, limit: int, order: str | None) -> list[dict[str, Any]]:
        kwargs: dict[str, Any] = {
            "domain": domain,
            "offset": max(offset, 0),
            "limit": max(limit, 1),
        }
        if fields:
            kwargs["fields"] = fields
        if order:
            kwargs["order"] = order
        rows = self.execute_kw(model, "search_read", [], kwargs)
        return rows if isinstance(rows, list) else []

    def read_one(self, model: str, record_id: int, fields: list[str] | None = None) -> dict[str, Any] | None:
        kwargs: dict[str, Any] = {}
        if fields:
            kwargs["fields"] = fields

        rows = self.execute_kw(model, "read", [[record_id]], kwargs)
        if isinstance(rows, list) and rows:
            row = rows[0]
            return row if isinstance(row, dict) else None
        return None

    def create(self, model: str, values: dict[str, Any]) -> int:
        record_id = self.execute_kw(model, "create", [values], {})
        return int(record_id)

    def update(self, model: str, record_id: int, values: dict[str, Any]) -> bool:
        return bool(self.execute_kw(model, "write", [[record_id], values], {}))

    def delete(self, model: str, record_id: int) -> bool:
        return bool(self.execute_kw(model, "unlink", [[record_id]], {}))
