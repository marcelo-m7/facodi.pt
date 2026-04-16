from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, List

from odoo_test_utils import OdooClient, get_odoo_credentials, load_env


CANDIDATE_MODELS = [
    "res.partner",
    "sale.order",
    "crm.lead",
    "account.move",
]


def pick_writable_text_field(client: OdooClient, model_name: str) -> str | None:
    fields_meta = client.execute(
        model_name,
        "fields_get",
        [],
        {"attributes": ["type", "readonly", "store"]},
    )

    preferred = ["name", "reference", "origin", "description", "ref"]
    candidates: List[str] = []

    for fname, meta in fields_meta.items():
        ftype = meta.get("type")
        readonly = bool(meta.get("readonly"))
        stored = meta.get("store", True)
        if ftype in {"char", "text"} and not readonly and stored:
            candidates.append(fname)

    for f in preferred:
        if f in candidates:
            return f
    return candidates[0] if candidates else None


def probe_model(client: OdooClient, model_name: str) -> Dict[str, Any]:
    row: Dict[str, Any] = {"model": model_name}
    try:
        can_read = bool(client.execute(model_name, "check_access_rights", ["read", False]))
        can_write = bool(client.execute(model_name, "check_access_rights", ["write", False]))
        row["can_read"] = can_read
        row["can_write"] = can_write

        if not can_read or not can_write:
            row["status"] = "skipped_no_access"
            return row

        ids = client.execute(model_name, "search", [[]], {"limit": 1})
        if not ids:
            row["status"] = "skipped_no_records"
            return row

        rid = int(ids[0])
        field = pick_writable_text_field(client, model_name)
        if not field:
            row["status"] = "skipped_no_text_field"
            row["record_id"] = rid
            return row

        current = client.execute(model_name, "read", [[rid], [field]])[0].get(field)
        if current is None:
            row["status"] = "skipped_none_value"
            row["record_id"] = rid
            row["field"] = field
            return row

        if not isinstance(current, str):
            row["status"] = "skipped_non_string"
            row["record_id"] = rid
            row["field"] = field
            return row

        ok = bool(client.execute(model_name, "write", [[rid], {field: current}]))
        row["status"] = "ok" if ok else "failed_write_return_false"
        row["record_id"] = rid
        row["field"] = field
        row["value_length"] = len(current)
        return row
    except Exception as exc:
        row["status"] = "error"
        row["error"] = f"{exc.__class__.__name__}: {exc}"
        return row


def main() -> int:
    workspace_root = Path(__file__).resolve().parents[2]
    project_root = workspace_root / "Projects" / "facodi.pt"

    try:
        env_used = load_env(workspace_root=workspace_root, project_root=project_root)
        host, db, user, password = get_odoo_credentials()
        client = OdooClient(host=host, db=db, user=user, password=password)
        uid = client.authenticate()

        probes = [probe_model(client, model_name) for model_name in CANDIDATE_MODELS]

        payload = {
            "status": "ok",
            "env_file_used": str(env_used),
            "host": host,
            "db": db,
            "user": user,
            "auth_uid": uid,
            "probes": probes,
            "summary": {
                "ok_count": sum(1 for p in probes if p.get("status") == "ok"),
                "error_count": sum(1 for p in probes if p.get("status") == "error"),
                "skipped_count": sum(1 for p in probes if str(p.get("status", "")).startswith("skipped_")),
            },
        }
        print(json.dumps(payload, ensure_ascii=False, indent=2))
        return 0
    except Exception as exc:
        payload = {
            "status": "fail",
            "error": f"{exc.__class__.__name__}: {exc}",
        }
        print(json.dumps(payload, ensure_ascii=False, indent=2))
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
