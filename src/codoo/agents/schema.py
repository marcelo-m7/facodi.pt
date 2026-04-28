"""Odoo schema discovery: reads ir.model, ir.model.fields, ir.actions.server."""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from codoo.odoo.client import AsyncOdooClient


@dataclass
class FieldSchema:
    name: str
    string: str
    ttype: str
    required: bool
    readonly: bool
    relation: str = ""  # for relational fields


@dataclass
class ModelSchema:
    model: str
    name: str
    description: str = ""
    fields: list[FieldSchema] = field(default_factory=list)

    @property
    def readable_fields(self) -> list[FieldSchema]:
        """Fields useful for search_read (exclude computed-only, binary)."""
        excluded = {"binary", "many2many_tags"}
        return [f for f in self.fields if f.ttype not in excluded]

    def to_dict(self) -> dict[str, Any]:
        return {
            "model": self.model,
            "name": self.name,
            "description": self.description,
            "fields": [
                {
                    "name": f.name,
                    "string": f.string,
                    "type": f.ttype,
                    "required": f.required,
                    "readonly": f.readonly,
                    "relation": f.relation,
                }
                for f in self.fields
            ],
        }


@dataclass
class ServerActionSchema:
    id: int
    name: str
    model_name: str
    state: str  # code, object_create, object_write, multi, etc.
    code: str = ""
    binding_model_id: int = 0

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "model": self.model_name,
            "state": self.state,
            "binding_model_id": self.binding_model_id,
        }


@dataclass
class OdooSchema:
    """Full discovered schema for an Odoo instance."""

    host: str
    database: str
    models: dict[str, ModelSchema] = field(default_factory=dict)
    server_actions: list[ServerActionSchema] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return {
            "host": self.host,
            "database": self.database,
            "model_count": len(self.models),
            "server_action_count": len(self.server_actions),
            "models": {k: v.to_dict() for k, v in self.models.items()},
            "server_actions": [s.to_dict() for s in self.server_actions],
        }

    def save(self, path: Path) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(self.to_dict(), indent=2, ensure_ascii=False))

    @classmethod
    def load(cls, path: Path) -> "OdooSchema":
        raw = json.loads(path.read_text())
        schema = cls(host=raw["host"], database=raw["database"])
        for model_name, m in raw.get("models", {}).items():
            ms = ModelSchema(
                model=m["model"],
                name=m["name"],
                description=m.get("description", ""),
                fields=[
                    FieldSchema(
                        name=f["name"],
                        string=f["string"],
                        ttype=f["type"],
                        required=f.get("required", False),
                        readonly=f.get("readonly", False),
                        relation=f.get("relation", ""),
                    )
                    for f in m.get("fields", [])
                ],
            )
            schema.models[model_name] = ms
        for sa in raw.get("server_actions", []):
            schema.server_actions.append(
                ServerActionSchema(
                    id=sa["id"],
                    name=sa["name"],
                    model_name=sa["model"],
                    state=sa["state"],
                    binding_model_id=sa.get("binding_model_id", 0),
                )
            )
        return schema

    def summary(self) -> str:
        lines = [
            f"Odoo schema: {self.host} / {self.database}",
            f"  {len(self.models)} models, {len(self.server_actions)} server actions",
            "",
            "Top models:",
        ]
        for m in list(self.models.values())[:20]:
            lines.append(f"  {m.model:45s} {m.name}")
        if len(self.models) > 20:
            lines.append(f"  ... and {len(self.models) - 20} more")
        return "\n".join(lines)


# ── Discovery functions ────────────────────────────────────────────────────────

# Commonly useful business models to fetch full field metadata for.
# All other models are discovered but fields are not fetched (too expensive).
PRIORITY_MODELS = {
    "res.partner",
    "sale.order",
    "sale.order.line",
    "purchase.order",
    "purchase.order.line",
    "account.move",
    "account.move.line",
    "product.product",
    "product.template",
    "product.category",
    "stock.picking",
    "stock.move",
    "project.project",
    "project.task",
    "crm.lead",
    "hr.employee",
    "hr.leave",
    "res.users",
    "res.company",
    "ir.actions.server",
}


async def discover_models(
    client: AsyncOdooClient,
    fetch_fields_for: set[str] | None = None,
) -> dict[str, ModelSchema]:
    """
    Fetch all installed models from ir.model.

    Args:
        client: Authenticated Odoo client
        fetch_fields_for: Set of model names to fetch full field metadata.
                          Defaults to PRIORITY_MODELS. Pass None for all (slow).

    Returns:
        Dict of model_name → ModelSchema
    """
    if fetch_fields_for is None:
        fetch_fields_for = PRIORITY_MODELS

    raw_models: list[dict] = await client.call(
        "ir.model",
        "search_read",
        [[]],
        {"fields": ["name", "model", "info"], "order": "model asc"},
    )

    models: dict[str, ModelSchema] = {}
    for m in raw_models:
        model_name = m["model"]
        ms = ModelSchema(
            model=model_name,
            name=m["name"],
            description=m.get("info", "") or "",
        )
        models[model_name] = ms

    # Fetch field metadata only for priority models (performance guard)
    target = fetch_fields_for if fetch_fields_for is not None else set(models.keys())
    for model_name in target:
        if model_name not in models:
            continue
        try:
            raw_fields: list[dict] = await client.call(
                "ir.model.fields",
                "search_read",
                [[("model_id.model", "=", model_name)]],
                {
                    "fields": ["name", "field_description", "ttype", "required", "readonly", "relation"],
                    "order": "name asc",
                },
            )
            models[model_name].fields = [
                FieldSchema(
                    name=f["name"],
                    string=f["field_description"],
                    ttype=f["ttype"],
                    required=f.get("required", False),
                    readonly=f.get("readonly", False),
                    relation=f.get("relation", "") or "",
                )
                for f in raw_fields
            ]
        except Exception:
            pass  # Non-priority model fields are optional

    return models


async def discover_server_actions(client: AsyncOdooClient) -> list[ServerActionSchema]:
    """Fetch all server actions from ir.actions.server."""
    raw: list[dict] = await client.call(
        "ir.actions.server",
        "search_read",
        [[]],
        {
            "fields": ["name", "model_name", "state", "binding_model_id"],
            "order": "model_name asc, name asc",
        },
    )
    return [
        ServerActionSchema(
            id=sa["id"],
            name=sa["name"],
            model_name=sa.get("model_name", "") or "",
            state=sa.get("state", "") or "",
            binding_model_id=(
                sa["binding_model_id"][0]
                if isinstance(sa.get("binding_model_id"), list)
                else 0
            ),
        )
        for sa in raw
    ]


async def build_schema(
    client: AsyncOdooClient,
    fetch_fields_for: set[str] | None = None,
) -> OdooSchema:
    """
    Full schema discovery: models + server actions.

    Args:
        client: Authenticated Odoo client
        fetch_fields_for: Models to fetch field metadata for. Defaults to PRIORITY_MODELS.

    Returns:
        Complete OdooSchema
    """
    models = await discover_models(client, fetch_fields_for=fetch_fields_for)
    server_actions = await discover_server_actions(client)
    return OdooSchema(
        host=client.host,
        database=client.database,
        models=models,
        server_actions=server_actions,
    )
