"""Odoo tools exposed as LLM function-calling declarations (Gemini format).

Each tool wraps a set of Odoo operations:
  - search_records    → model.search_read
  - get_record        → model.read
  - create_record     → model.create
  - update_record     → model.write
  - delete_record     → model.unlink
  - run_server_action → ir.actions.server execute
  - get_fields        → ir.model.fields introspection

Tools are registered in an OdooToolRegistry. The orchestrator builds the
Gemini function_declarations from the registry and dispatches calls back
through the registry's execute() method.
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Any

from codoo.agents.schema import OdooSchema
from codoo.odoo.client import AsyncOdooClient
from codoo.odoo.studio import create_studio_app, delete_studio_app


# ── Tool definitions ───────────────────────────────────────────────────────────

@dataclass
class ToolResult:
    success: bool
    data: Any
    error: str = ""

    def to_dict(self) -> dict[str, Any]:
        return {"success": self.success, "data": self.data, "error": self.error}


# Gemini function declaration format
FunctionDeclaration = dict[str, Any]


def _make_search_tool(model: str, model_label: str) -> FunctionDeclaration:
    return {
        "name": f"search_{model.replace('.', '_')}",
        "description": (
            f"Search {model_label} ({model}) records in Odoo. "
            "Returns a list of matching records with their field values."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "domain": {
                    "type": "string",
                    "description": (
                        "Odoo domain filter as JSON string. "
                        "E.g., '[[\"name\", \"ilike\", \"test\"]]'. "
                        "Use '[[]]' or '[]' for no filter."
                    ),
                },
                "fields": {
                    "type": "string",
                    "description": (
                        "Comma-separated list of fields to return. "
                        "E.g., 'id,name,email'. Leave empty for default fields."
                    ),
                },
                "limit": {
                    "type": "integer",
                    "description": "Maximum number of records to return (default 20, max 100).",
                },
                "order": {
                    "type": "string",
                    "description": "Sort order. E.g., 'name asc' or 'create_date desc'.",
                },
            },
            "required": [],
        },
    }


def _make_get_tool(model: str, model_label: str) -> FunctionDeclaration:
    return {
        "name": f"get_{model.replace('.', '_')}",
        "description": f"Get a single {model_label} ({model}) record by its ID.",
        "parameters": {
            "type": "object",
            "properties": {
                "record_id": {
                    "type": "integer",
                    "description": "Odoo record ID.",
                },
                "fields": {
                    "type": "string",
                    "description": "Comma-separated list of fields to return. Leave empty for all.",
                },
            },
            "required": ["record_id"],
        },
    }


def _make_create_tool(model: str, model_label: str) -> FunctionDeclaration:
    return {
        "name": f"create_{model.replace('.', '_')}",
        "description": f"Create a new {model_label} ({model}) record in Odoo.",
        "parameters": {
            "type": "object",
            "properties": {
                "values": {
                    "type": "string",
                    "description": (
                        "Record field values as a JSON object string. "
                        "E.g., '{\"name\": \"Test\", \"email\": \"a@b.com\"}'."
                    ),
                },
            },
            "required": ["values"],
        },
    }


def _make_update_tool(model: str, model_label: str) -> FunctionDeclaration:
    return {
        "name": f"update_{model.replace('.', '_')}",
        "description": f"Update an existing {model_label} ({model}) record.",
        "parameters": {
            "type": "object",
            "properties": {
                "record_id": {"type": "integer", "description": "Record ID to update."},
                "values": {
                    "type": "string",
                    "description": "Fields to update as a JSON object string.",
                },
            },
            "required": ["record_id", "values"],
        },
    }


def _make_delete_tool(model: str, model_label: str) -> FunctionDeclaration:
    return {
        "name": f"delete_{model.replace('.', '_')}",
        "description": (
            f"Delete a {model_label} ({model}) record. "
            "Use with caution — this is irreversible."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "record_id": {"type": "integer", "description": "Record ID to delete."},
            },
            "required": ["record_id"],
        },
    }


GENERIC_TOOLS: list[FunctionDeclaration] = [
    {
        "name": "odoo_create_studio_app",
        "description": (
            "Create a new custom app (Studio-style) in Odoo: manual model + list/form views + window action + root menu."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "app_name": {"type": "string", "description": "Human app name shown in menu and action."},
                "model_name": {
                    "type": "string",
                    "description": "Optional technical model name (e.g., 'x_sales_ops'). If empty, generated from app_name.",
                },
                "menu_sequence": {
                    "type": "integer",
                    "description": "Optional menu sequence (default 90).",
                },
                "menu_icon": {
                    "type": "string",
                    "description": "Optional launcher icon format, e.g. 'fa fa-cubes,#875A7B,#FFFFFF'.",
                },
            },
            "required": ["app_name"],
        },
    },
    {
        "name": "odoo_delete_studio_app",
        "description": (
            "Delete a Studio-style custom app with complete cleanup (menus, actions, views, ACLs, fields, model). "
            "By default runs in dry-run mode."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "model_name": {"type": "string", "description": "Technical model name, e.g. 'x_my_app'."},
                "mode": {
                    "type": "string",
                    "description": "Use 'dry-run' (default) or 'apply' for destructive deletion.",
                },
                "include_server_actions": {
                    "type": "string",
                    "description": "'true' to also delete ir.actions.server bound to model.",
                },
            },
            "required": ["model_name"],
        },
    },
    {
        "name": "odoo_search_any",
        "description": (
            "Search any Odoo model by technical name. Use this for models not covered "
            "by specific search tools, or when you need to query an arbitrary model."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "model": {"type": "string", "description": "Odoo model name (e.g., 'res.partner')."},
                "domain": {"type": "string", "description": "Odoo domain as JSON string."},
                "fields": {"type": "string", "description": "Comma-separated field names."},
                "limit": {"type": "integer", "description": "Max records (default 20)."},
            },
            "required": ["model"],
        },
    },
    {
        "name": "odoo_run_server_action",
        "description": "Execute an Odoo server action by its ID on a set of records.",
        "parameters": {
            "type": "object",
            "properties": {
                "action_id": {"type": "integer", "description": "Server action ID."},
                "model": {"type": "string", "description": "Model the action runs on."},
                "record_ids": {
                    "type": "string",
                    "description": "JSON array of record IDs to run the action on.",
                },
            },
            "required": ["action_id", "model"],
        },
    },
    {
        "name": "odoo_list_server_actions",
        "description": "List available server actions, optionally filtered by model.",
        "parameters": {
            "type": "object",
            "properties": {
                "model": {
                    "type": "string",
                    "description": "Filter by model name. Leave empty for all.",
                },
            },
            "required": [],
        },
    },
    {
        "name": "odoo_get_model_fields",
        "description": "Introspect the fields of any Odoo model.",
        "parameters": {
            "type": "object",
            "properties": {
                "model": {"type": "string", "description": "Odoo model name."},
            },
            "required": ["model"],
        },
    },
]


# ── Registry ───────────────────────────────────────────────────────────────────

class OdooToolRegistry:
    """
    Builds and executes LLM function-calling tools backed by Odoo API.

    Each business model in the schema gets CRUD tools auto-generated.
    Generic tools cover any other model and server actions.
    """

    # Models to generate full CRUD tools for
    CRUD_MODELS = {
        "res.partner": "Contact",
        "sale.order": "Sale Order",
        "sale.order.line": "Sale Order Line",
        "purchase.order": "Purchase Order",
        "account.move": "Invoice / Journal Entry",
        "product.product": "Product Variant",
        "product.template": "Product Template",
        "stock.picking": "Stock Transfer / Delivery",
        "project.project": "Project",
        "project.task": "Task",
        "crm.lead": "CRM Lead / Opportunity",
        "hr.employee": "Employee",
        "res.users": "User",
    }

    def __init__(self, client: AsyncOdooClient, schema: OdooSchema) -> None:
        self._client = client
        self._schema = schema
        # name → (model, operation) used for dispatch
        self._tool_map: dict[str, tuple[str, str]] = {}
        self._declarations: list[FunctionDeclaration] = []
        self._build()

    def _build(self) -> None:
        for model, label in self.CRUD_MODELS.items():
            if model not in self._schema.models:
                continue
            safe = model.replace(".", "_")
            self._declarations.extend([
                _make_search_tool(model, label),
                _make_get_tool(model, label),
                _make_create_tool(model, label),
                _make_update_tool(model, label),
                _make_delete_tool(model, label),
            ])
            self._tool_map[f"search_{safe}"] = (model, "search")
            self._tool_map[f"get_{safe}"] = (model, "get")
            self._tool_map[f"create_{safe}"] = (model, "create")
            self._tool_map[f"update_{safe}"] = (model, "update")
            self._tool_map[f"delete_{safe}"] = (model, "delete")

        self._declarations.extend(GENERIC_TOOLS)

    @property
    def declarations(self) -> list[FunctionDeclaration]:
        return self._declarations

    async def execute(self, tool_name: str, tool_args: dict[str, Any]) -> ToolResult:
        """Dispatch a tool call and return ToolResult."""
        try:
            # Generic tools
            if tool_name == "odoo_create_studio_app":
                return await self._exec_create_studio_app(tool_args)
            if tool_name == "odoo_delete_studio_app":
                return await self._exec_delete_studio_app(tool_args)
            if tool_name == "odoo_search_any":
                return await self._exec_search_any(tool_args)
            if tool_name == "odoo_run_server_action":
                return await self._exec_run_server_action(tool_args)
            if tool_name == "odoo_list_server_actions":
                return await self._exec_list_server_actions(tool_args)
            if tool_name == "odoo_get_model_fields":
                return await self._exec_get_model_fields(tool_args)

            # Model-specific CRUD tools
            if tool_name in self._tool_map:
                model, operation = self._tool_map[tool_name]
                return await self._exec_crud(model, operation, tool_args)

            return ToolResult(success=False, data=None, error=f"Unknown tool: {tool_name}")

        except Exception as exc:
            return ToolResult(success=False, data=None, error=str(exc))

    # ── CRUD dispatcher ───────────────────────────────────────────────────────

    async def _exec_crud(self, model: str, operation: str, args: dict) -> ToolResult:
        if operation == "search":
            return await self._exec_search(model, args)
        if operation == "get":
            return await self._exec_get(model, args)
        if operation == "create":
            return await self._exec_create(model, args)
        if operation == "update":
            return await self._exec_update(model, args)
        if operation == "delete":
            return await self._exec_delete(model, args)
        return ToolResult(success=False, data=None, error=f"Unknown operation: {operation}")

    async def _exec_search(self, model: str, args: dict) -> ToolResult:
        domain_str = args.get("domain", "[]")
        try:
            domain = json.loads(domain_str)
        except json.JSONDecodeError:
            domain = []

        fields_str = args.get("fields", "")
        fields = [f.strip() for f in fields_str.split(",") if f.strip()] if fields_str else []
        limit = min(int(args.get("limit", 20)), 100)
        order = args.get("order", "id asc")

        result = await self._client.call(
            model, "search_read", [domain], {"fields": fields, "limit": limit, "order": order}
        )
        return ToolResult(success=True, data=result)

    async def _exec_get(self, model: str, args: dict) -> ToolResult:
        record_id = int(args["record_id"])
        fields_str = args.get("fields", "")
        fields = [f.strip() for f in fields_str.split(",") if f.strip()] if fields_str else []
        result = await self._client.call(model, "read", [[record_id], fields])
        return ToolResult(success=True, data=result[0] if result else None)

    async def _exec_create(self, model: str, args: dict) -> ToolResult:
        try:
            values = json.loads(args["values"])
        except (json.JSONDecodeError, KeyError) as e:
            return ToolResult(success=False, data=None, error=f"Invalid values JSON: {e}")
        record_id = await self._client.call(model, "create", [values])
        return ToolResult(success=True, data={"id": record_id})

    async def _exec_update(self, model: str, args: dict) -> ToolResult:
        record_id = int(args["record_id"])
        try:
            values = json.loads(args["values"])
        except (json.JSONDecodeError, KeyError) as e:
            return ToolResult(success=False, data=None, error=f"Invalid values JSON: {e}")
        result = await self._client.call(model, "write", [[record_id], values])
        return ToolResult(success=True, data={"updated": result, "id": record_id})

    async def _exec_delete(self, model: str, args: dict) -> ToolResult:
        record_id = int(args["record_id"])
        result = await self._client.call(model, "unlink", [[record_id]])
        return ToolResult(success=True, data={"deleted": result, "id": record_id})

    # ── Generic tools ─────────────────────────────────────────────────────────

    async def _exec_search_any(self, args: dict) -> ToolResult:
        model = args["model"]
        domain_str = args.get("domain", "[]")
        try:
            domain = json.loads(domain_str)
        except json.JSONDecodeError:
            domain = []
        fields_str = args.get("fields", "")
        fields = [f.strip() for f in fields_str.split(",") if f.strip()] if fields_str else []
        limit = min(int(args.get("limit", 20)), 100)
        result = await self._client.call(
            model, "search_read", [domain], {"fields": fields, "limit": limit}
        )
        return ToolResult(success=True, data=result)

    async def _exec_create_studio_app(self, args: dict) -> ToolResult:
        app_name = args.get("app_name", "").strip()
        if not app_name:
            return ToolResult(success=False, data=None, error="app_name is required")
        model_name = (args.get("model_name") or "").strip() or None
        menu_sequence = int(args.get("menu_sequence", 90))
        menu_icon = (args.get("menu_icon") or "").strip() or "fa fa-cubes,#875A7B,#FFFFFF"

        result = await create_studio_app(
            self._client,
            app_name=app_name,
            model_name=model_name,
            menu_sequence=menu_sequence,
            menu_icon=menu_icon,
            create_demo_record=False,
        )
        return ToolResult(success=True, data=result)

    async def _exec_delete_studio_app(self, args: dict) -> ToolResult:
        model_name = (args.get("model_name") or "").strip()
        if not model_name:
            return ToolResult(success=False, data=None, error="model_name is required")

        mode = (args.get("mode") or "dry-run").strip().lower()
        dry_run = mode != "apply"
        include_server_actions = (args.get("include_server_actions") or "").strip().lower() in {
            "1",
            "true",
            "yes",
            "y",
        }

        result = await delete_studio_app(
            self._client,
            model_name=model_name,
            include_server_actions=include_server_actions,
            dry_run=dry_run,
        )
        return ToolResult(success=True, data=result)

    async def _exec_run_server_action(self, args: dict) -> ToolResult:
        action_id = int(args["action_id"])
        model = args["model"]
        record_ids_str = args.get("record_ids", "[]")
        try:
            record_ids = json.loads(record_ids_str)
        except json.JSONDecodeError:
            record_ids = []

        # Set active_ids on context then call run()
        result = await self._client.call(
            "ir.actions.server",
            "run",
            [[action_id]],
            {"context": {"active_model": model, "active_ids": record_ids, "active_id": record_ids[0] if record_ids else False}},
        )
        return ToolResult(success=True, data=result)

    async def _exec_list_server_actions(self, args: dict) -> ToolResult:
        model_filter = args.get("model", "")
        domain = [["model_name", "=", model_filter]] if model_filter else []
        actions = [sa.to_dict() for sa in self._schema.server_actions
                   if not model_filter or sa.model_name == model_filter]
        return ToolResult(success=True, data=actions)

    async def _exec_get_model_fields(self, args: dict) -> ToolResult:
        model = args["model"]
        ms = self._schema.models.get(model)
        if ms and ms.fields:
            return ToolResult(success=True, data=[
                {"name": f.name, "string": f.string, "type": f.ttype,
                 "required": f.required, "relation": f.relation}
                for f in ms.fields
            ])
        # Fallback: fetch live from API
        raw = await self._client.call(
            "ir.model.fields",
            "search_read",
            [[("model_id.model", "=", model)]],
            {"fields": ["name", "field_description", "ttype", "required", "relation"]},
        )
        return ToolResult(success=True, data=raw)
