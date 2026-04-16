from __future__ import annotations

import json
from pathlib import Path

from odoo_test_utils import OdooClient, get_odoo_credentials, load_env


def main() -> int:
    workspace_root = Path(__file__).resolve().parents[2]
    project_root = workspace_root.parent

    try:
        env_used = load_env(workspace_root=workspace_root, project_root=project_root)
        host, db, user, password = get_odoo_credentials()

        client = OdooClient(host=host, db=db, user=user, password=password)
        version = client.version()
        uid = client.authenticate()

        payload = {
            "status": "ok",
            "env_file_used": str(env_used),
            "host": host,
            "db": db,
            "user": user,
            "server_version": version.get("server_version"),
            "protocol": "xmlrpc",
            "auth_uid": uid,
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
