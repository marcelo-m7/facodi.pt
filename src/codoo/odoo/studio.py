"""Studio-style app creation helpers for Odoo SaaS via API.

This module creates a custom app equivalent to what Web Studio does at a high level:
1. Create a manual model (x_<app_slug>) in ir.model
2. Ensure default x_name field exists
3. Create list and form views for the model
4. Create an ir.actions.act_window
5. Create a root ir.ui.menu linked to that action
"""

from __future__ import annotations

import re
from typing import Any

from codoo.odoo.client import AsyncOdooClient


def _slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9_]+", "_", value.strip().lower())
    slug = re.sub(r"_+", "_", slug).strip("_")
    return slug or "app"


async def create_studio_app(
    client: AsyncOdooClient,
    app_name: str,
    model_name: str | None = None,
    menu_sequence: int = 90,
    menu_icon: str = "fa fa-cubes,#875A7B,#FFFFFF",
    grant_all_internal_access: bool = True,
    create_demo_record: bool = False,
) -> dict[str, Any]:
    """Create a new custom app using Odoo API primitives.

    Args:
        client: Authenticated AsyncOdooClient
        app_name: Human-friendly app name (menu/action/model label)
        model_name: Optional technical model name. If omitted, generated as x_<slug>
        menu_sequence: Sequence for root menu placement
        menu_icon: Odoo launcher icon format (fontawesome,class + bg + fg)
        grant_all_internal_access: Create a default model ACL record
        create_demo_record: Whether to create first record with x_name=app_name

    Returns:
        Dict with ids and metadata for created entities.

    Raises:
        ValueError: if app/model already exists
    """
    if not app_name.strip():
        raise ValueError("app_name cannot be empty")

    target_model = model_name or f"x_{_slugify(app_name)}"

    # Guard: model must not exist
    existing_model = await client.call(
        "ir.model",
        "search_read",
        [[("model", "=", target_model)]],
        {"fields": ["id", "name", "model"], "limit": 1},
    )
    if existing_model:
        raise ValueError(
            f"Model already exists: {target_model} (id={existing_model[0]['id']})"
        )

    # Guard: root menu with same name should not exist
    existing_menu = await client.call(
        "ir.ui.menu",
        "search_read",
        [[("name", "=", app_name), ("parent_id", "=", False)]],
        {"fields": ["id", "name"], "limit": 1},
    )
    if existing_menu:
        raise ValueError(
            f"Root menu already exists with this name: {app_name} (id={existing_menu[0]['id']})"
        )

    # 1) model
    model_id = await client.call(
        "ir.model",
        "create",
        [
            {
                "name": app_name,
                "model": target_model,
                "state": "manual",
            }
        ],
    )

    # 2) x_name field (often auto-created, but ensure it exists)
    x_name_field = await client.call(
        "ir.model.fields",
        "search_read",
        [[("model_id", "=", model_id), ("name", "=", "x_name")]],
        {"fields": ["id", "name"], "limit": 1},
    )
    if x_name_field:
        x_name_field_id = x_name_field[0]["id"]
    else:
        x_name_field_id = await client.call(
            "ir.model.fields",
            "create",
            [
                {
                    "name": "x_name",
                    "model_id": model_id,
                    "model": target_model,
                    "field_description": "Name",
                    "ttype": "char",
                    "state": "manual",
                    "required": True,
                }
            ],
        )

    # 3) list + form views
    list_view_id = await client.call(
        "ir.ui.view",
        "create",
        [
            {
                "name": f"{target_model}.list",
                "type": "list",
                "model": target_model,
                "arch": "<list><field name='x_name'/></list>",
            }
        ],
    )

    form_view_id = await client.call(
        "ir.ui.view",
        "create",
        [
            {
                "name": f"{target_model}.form",
                "type": "form",
                "model": target_model,
                "arch": "<form><sheet><group><field name='x_name'/></group></sheet></form>",
            }
        ],
    )

    acl_id = None
    if grant_all_internal_access:
        # Without ACL, manual models are inaccessible and app menus may be hidden.
        acl_id = await client.call(
            "ir.model.access",
            "create",
            [
                {
                    "name": f"access_{target_model}_all",
                    "model_id": model_id,
                    # Keep group empty to allow access to all regular users in this instance.
                    "perm_read": True,
                    "perm_write": True,
                    "perm_create": True,
                    "perm_unlink": True,
                    "active": True,
                }
            ],
        )

    # 4) action
    action_id = await client.call(
        "ir.actions.act_window",
        "create",
        [
            {
                "name": app_name,
                "res_model": target_model,
                "view_mode": "list,form",
            }
        ],
    )

    # 5) menu
    menu_id = await client.call(
        "ir.ui.menu",
        "create",
        [
            {
                "name": app_name,
                "action": f"ir.actions.act_window,{action_id}",
                "parent_id": False,
                "sequence": menu_sequence,
                "web_icon": menu_icon,
            }
        ],
    )

    record_id = None
    if create_demo_record:
        record_id = await client.call(target_model, "create", [{"x_name": app_name}])

    return {
        "app_name": app_name,
        "model": target_model,
        "model_id": model_id,
        "x_name_field_id": x_name_field_id,
        "list_view_id": list_view_id,
        "form_view_id": form_view_id,
        "action_id": action_id,
        "menu_id": menu_id,
        "acl_id": acl_id,
        "demo_record_id": record_id,
    }


async def list_studio_apps(client: AsyncOdooClient) -> list[dict[str, Any]]:
    """List custom Studio-style apps (manual x_* models + linked action/menu)."""
    models = await client.call(
        "ir.model",
        "search_read",
        [[("state", "=", "manual"), ("model", "like", "x_")]],
        {"fields": ["id", "name", "model"], "order": "model asc", "limit": 1000},
    )
    if not models:
        return []

    model_names = [m["model"] for m in models]
    actions = await client.call(
        "ir.actions.act_window",
        "search_read",
        [[("res_model", "in", model_names)]],
        {"fields": ["id", "name", "res_model", "view_mode"], "limit": 1000},
    )
    actions_by_model: dict[str, list[dict[str, Any]]] = {}
    for a in actions:
        actions_by_model.setdefault(a["res_model"], []).append(a)

    menus = await client.call(
        "ir.ui.menu",
        "search_read",
        [[("parent_id", "=", False)]],
        {"fields": ["id", "name", "action", "active", "web_icon"], "limit": 1000},
    )

    menu_by_action_id: dict[int, dict[str, Any]] = {}
    for menu in menus:
        action_ref = menu.get("action")
        if isinstance(action_ref, str) and action_ref.startswith("ir.actions.act_window,"):
            try:
                action_id = int(action_ref.split(",", 1)[1])
                menu_by_action_id[action_id] = menu
            except (ValueError, IndexError):
                continue

    result: list[dict[str, Any]] = []
    for m in models:
        candidates = actions_by_model.get(m["model"], [])
        action = None
        for cand in candidates:
            if cand["id"] in menu_by_action_id:
                action = cand
                break
        if action is None and candidates:
            action = candidates[0]
        menu = menu_by_action_id.get(action["id"]) if action else None

        acl_count = await client.call(
            "ir.model.access",
            "search_count",
            [[("model_id", "=", m["id"])]],
            {},
        )

        result.append(
            {
                "model_id": m["id"],
                "model": m["model"],
                "name": m["name"],
                "action_id": action["id"] if action else None,
                "menu_id": menu["id"] if menu else None,
                "menu_name": menu["name"] if menu else None,
                "menu_active": menu["active"] if menu else None,
                "menu_has_icon": bool(menu and menu.get("web_icon")),
                "acl_count": acl_count,
            }
        )
    return result


async def repair_studio_app(
    client: AsyncOdooClient,
    model_name: str,
    menu_icon: str = "fa fa-cubes,#875A7B,#FFFFFF",
) -> dict[str, Any]:
    """Repair a custom app to be visible and accessible on home page.

    Ensures for a given model:
    - x_name field exists
    - list/form views exist
    - at least one ACL exists (full CRUD)
    - window action exists
    - root menu exists, active, and with launcher icon
    """
    model_rows = await client.call(
        "ir.model",
        "search_read",
        [[("model", "=", model_name)]],
        {"fields": ["id", "name", "model", "state"], "limit": 1},
    )
    if not model_rows:
        raise ValueError(f"Model not found: {model_name}")

    model = model_rows[0]
    model_id = model["id"]
    app_name = model["name"]

    created: dict[str, Any] = {
        "model": model_name,
        "model_id": model_id,
        "created": {},
        "updated": {},
    }

    x_name_field = await client.call(
        "ir.model.fields",
        "search_read",
        [[("model_id", "=", model_id), ("name", "=", "x_name")]],
        {"fields": ["id", "name"], "limit": 1},
    )
    if not x_name_field:
        fid = await client.call(
            "ir.model.fields",
            "create",
            [
                {
                    "name": "x_name",
                    "model_id": model_id,
                    "model": model_name,
                    "field_description": "Name",
                    "ttype": "char",
                    "state": "manual",
                    "required": True,
                }
            ],
        )
        created["created"]["x_name_field_id"] = fid

    views = await client.call(
        "ir.ui.view",
        "search_read",
        [[("model", "=", model_name), ("type", "in", ["list", "form"])]],
        {"fields": ["id", "type", "name"], "limit": 50},
    )
    has_list = any(v["type"] == "list" for v in views)
    has_form = any(v["type"] == "form" for v in views)
    if not has_list:
        vid = await client.call(
            "ir.ui.view",
            "create",
            [
                {
                    "name": f"{model_name}.list",
                    "type": "list",
                    "model": model_name,
                    "arch": "<list><field name='x_name'/></list>",
                }
            ],
        )
        created["created"]["list_view_id"] = vid
    if not has_form:
        vid = await client.call(
            "ir.ui.view",
            "create",
            [
                {
                    "name": f"{model_name}.form",
                    "type": "form",
                    "model": model_name,
                    "arch": "<form><sheet><group><field name='x_name'/></group></sheet></form>",
                }
            ],
        )
        created["created"]["form_view_id"] = vid

    acl = await client.call(
        "ir.model.access",
        "search_read",
        [[("model_id", "=", model_id)]],
        {"fields": ["id", "name"], "limit": 1},
    )
    if not acl:
        aid = await client.call(
            "ir.model.access",
            "create",
            [
                {
                    "name": f"access_{model_name}_all",
                    "model_id": model_id,
                    "perm_read": True,
                    "perm_write": True,
                    "perm_create": True,
                    "perm_unlink": True,
                    "active": True,
                }
            ],
        )
        created["created"]["acl_id"] = aid

    action = await client.call(
        "ir.actions.act_window",
        "search_read",
        [[("res_model", "=", model_name)]],
        {"fields": ["id", "name", "view_mode"], "limit": 1},
    )
    if action:
        action_id = action[0]["id"]
    else:
        action_id = await client.call(
            "ir.actions.act_window",
            "create",
            [
                {
                    "name": app_name,
                    "res_model": model_name,
                    "view_mode": "list,form",
                }
            ],
        )
        created["created"]["action_id"] = action_id

    action_ref = f"ir.actions.act_window,{action_id}"
    menus = await client.call(
        "ir.ui.menu",
        "search_read",
        [[("parent_id", "=", False), ("action", "=", action_ref)]],
        {"fields": ["id", "name", "active", "web_icon"], "limit": 1},
    )
    if menus:
        menu_id = menus[0]["id"]
        updates: dict[str, Any] = {}
        if not menus[0].get("active"):
            updates["active"] = True
        if not menus[0].get("web_icon"):
            updates["web_icon"] = menu_icon
        if updates:
            await client.call("ir.ui.menu", "write", [[menu_id], updates])
            created["updated"]["menu"] = {"menu_id": menu_id, **updates}
    else:
        menu_id = await client.call(
            "ir.ui.menu",
            "create",
            [
                {
                    "name": app_name,
                    "action": action_ref,
                    "parent_id": False,
                    "sequence": 90,
                    "web_icon": menu_icon,
                }
            ],
        )
        created["created"]["menu_id"] = menu_id

    created["action_id"] = action_id
    created["menu_id"] = menu_id
    return created


async def _studio_app_components(
    client: AsyncOdooClient,
    model_name: str,
    include_server_actions: bool = False,
) -> dict[str, Any]:
    """Collect all linked records for a Studio-style app model."""
    model_rows = await client.call(
        "ir.model",
        "search_read",
        [[("model", "=", model_name)]],
        {"fields": ["id", "name", "model", "state"], "limit": 1},
    )
    if not model_rows:
        raise ValueError(f"Model not found: {model_name}")

    model = model_rows[0]
    model_id = model["id"]

    views = await client.call(
        "ir.ui.view",
        "search_read",
        [[("model", "=", model_name)]],
        {"fields": ["id", "name", "type"], "limit": 1000},
    )

    actions = await client.call(
        "ir.actions.act_window",
        "search_read",
        [[("res_model", "=", model_name)]],
        {"fields": ["id", "name", "res_model", "view_mode"], "limit": 1000},
    )
    action_refs = [f"ir.actions.act_window,{a['id']}" for a in actions]

    menus = []
    if action_refs:
        menus = await client.call(
            "ir.ui.menu",
            "search_read",
            [[("action", "in", action_refs)]],
            {"fields": ["id", "name", "parent_id", "action", "active"], "limit": 1000},
        )

    acls = await client.call(
        "ir.model.access",
        "search_read",
        [[("model_id", "=", model_id)]],
        {"fields": ["id", "name", "active"], "limit": 1000},
    )

    # Studio custom fields for this model only (exclude core technical fields)
    fields = await client.call(
        "ir.model.fields",
        "search_read",
        [[("model_id", "=", model_id), ("state", "=", "manual")]],
        {"fields": ["id", "name", "ttype"], "limit": 1000},
    )

    server_actions: list[dict[str, Any]] = []
    if include_server_actions:
        server_actions = await client.call(
            "ir.actions.server",
            "search_read",
            [[("model_name", "=", model_name)]],
            {"fields": ["id", "name", "state"], "limit": 1000},
        )

    return {
        "model": model,
        "fields": fields,
        "views": views,
        "actions": actions,
        "menus": menus,
        "acls": acls,
        "server_actions": server_actions,
    }


async def plan_studio_app_delete(
    client: AsyncOdooClient,
    model_name: str,
    include_server_actions: bool = False,
) -> dict[str, Any]:
    """Return deletion plan for a Studio-style app model without deleting data."""
    components = await _studio_app_components(
        client,
        model_name=model_name,
        include_server_actions=include_server_actions,
    )
    return {
        "model": components["model"],
        "counts": {
            "fields": len(components["fields"]),
            "views": len(components["views"]),
            "actions": len(components["actions"]),
            "menus": len(components["menus"]),
            "acls": len(components["acls"]),
            "server_actions": len(components["server_actions"]),
        },
        "ids": {
            "field_ids": [r["id"] for r in components["fields"]],
            "view_ids": [r["id"] for r in components["views"]],
            "action_ids": [r["id"] for r in components["actions"]],
            "menu_ids": [r["id"] for r in components["menus"]],
            "acl_ids": [r["id"] for r in components["acls"]],
            "server_action_ids": [r["id"] for r in components["server_actions"]],
        },
    }


async def delete_studio_app(
    client: AsyncOdooClient,
    model_name: str,
    include_server_actions: bool = False,
    dry_run: bool = True,
) -> dict[str, Any]:
    """Delete a Studio-style app with complete cleanup.

    Cleanup order:
    1) menus referencing app actions
    2) window actions
    3) views
    4) ACLs
    5) optional server actions
    6) manual model fields
    7) ir.model (drops custom model)
    """
    plan = await plan_studio_app_delete(
        client,
        model_name=model_name,
        include_server_actions=include_server_actions,
    )
    plan["dry_run"] = dry_run

    if dry_run:
        plan["deleted"] = {
            "menu_ids": [],
            "action_ids": [],
            "view_ids": [],
            "acl_ids": [],
            "server_action_ids": [],
            "field_ids": [],
            "model_id": None,
        }
        return plan

    ids = plan["ids"]
    deleted = {
        "menu_ids": [],
        "action_ids": [],
        "view_ids": [],
        "acl_ids": [],
        "server_action_ids": [],
        "field_ids": [],
        "model_id": None,
    }

    if ids["menu_ids"]:
        await client.call("ir.ui.menu", "unlink", [ids["menu_ids"]])
        deleted["menu_ids"] = ids["menu_ids"]

    if ids["action_ids"]:
        await client.call("ir.actions.act_window", "unlink", [ids["action_ids"]])
        deleted["action_ids"] = ids["action_ids"]

    if ids["view_ids"]:
        await client.call("ir.ui.view", "unlink", [ids["view_ids"]])
        deleted["view_ids"] = ids["view_ids"]

    if ids["acl_ids"]:
        await client.call("ir.model.access", "unlink", [ids["acl_ids"]])
        deleted["acl_ids"] = ids["acl_ids"]

    if ids["server_action_ids"]:
        await client.call("ir.actions.server", "unlink", [ids["server_action_ids"]])
        deleted["server_action_ids"] = ids["server_action_ids"]

    if ids["field_ids"]:
        await client.call("ir.model.fields", "unlink", [ids["field_ids"]])
        deleted["field_ids"] = ids["field_ids"]

    model_id = plan["model"]["id"]
    await client.call("ir.model", "unlink", [[model_id]])
    deleted["model_id"] = model_id

    plan["deleted"] = deleted
    return plan
