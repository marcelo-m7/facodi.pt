from __future__ import annotations

import json
from pathlib import Path

from odoo_test_utils import OdooClient, get_odoo_credentials, load_env


def main() -> int:
    workspace_root = Path(__file__).resolve().parents[2]
    project_root = workspace_root / "Projects" / "facodi.pt"

    try:
        env_used = load_env(workspace_root=workspace_root, project_root=project_root)
        host, db, user, password = get_odoo_credentials()
        client = OdooClient(host=host, db=db, user=user, password=password)
        uid = client.authenticate()

        # Quick probe on common models used in operational scenarios.
        models_to_check = [
            "res.partner",
            "crm.lead",
            "sale.order",
            "account.move",
            "event.event",
            "event.registration",
        ]

        rows = []
        for model_name in models_to_check:
            row = {"model": model_name}
            try:
                row["can_read"] = bool(client.execute(model_name, "check_access_rights", ["read", False]))
                row["can_write"] = bool(client.execute(model_name, "check_access_rights", ["write", False]))
                row["can_create"] = bool(client.execute(model_name, "check_access_rights", ["create", False]))
                sample_ids = client.execute(model_name, "search", [[]], {"limit": 1})
                row["has_records"] = bool(sample_ids)
                row["sample_id"] = sample_ids[0] if sample_ids else None
            except Exception as exc:
                row["error"] = f"{exc.__class__.__name__}: {exc}"
            rows.append(row)

        payload = {
            "status": "ok",
            "env_file_used": str(env_used),
            "host": host,
            "db": db,
            "user": user,
            "auth_uid": uid,
            "models": rows,
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
