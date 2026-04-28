"""Bootstrap Studio projetos models using Odoo API.

This module replaces legacy script-based model bootstrap logic.
"""

from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path
from typing import Any

from codoo.config import load_config
from codoo.odoo.client import AsyncOdooClient


class BootstrapProjetosModelsExecutor:
    """Create or audit base Studio models for projetos app."""

    def __init__(self) -> None:
        self.config = load_config()
        self.client = AsyncOdooClient(
            host=self.config.odoo_host,
            database=self.config.odoo_db,
            username=self.config.odoo_username,
            password=self.config.odoo_password,
        )

    @property
    def logs_dir(self) -> Path:
        return Path(self.config.evidence_dir)

    async def _save_log(self, payload: dict[str, Any]) -> Path:
        self.logs_dir.mkdir(parents=True, exist_ok=True)
        ts = datetime.now().strftime("%Y%m%d_%H%M%S")
        out = self.logs_dir / f"projetos_bootstrap_models_{ts}.json"
        out.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
        return out

    async def execute(self) -> dict[str, Any]:
        models_to_create: dict[str, dict[str, Any]] = {
            "x_project_stage": {
                "name": "Project Stage",
                "fields": {
                    "x_name": {"ttype": "char", "label": "Name"},
                    "x_sequence": {"ttype": "integer", "label": "Sequence"},
                    "x_color": {"ttype": "integer", "label": "Color"},
                    "x_description": {"ttype": "text", "label": "Description"},
                },
            },
            "x_project_task": {
                "name": "Project Task",
                "fields": {
                    "x_name": {"ttype": "char", "label": "Task Name"},
                    "x_project_id": {"ttype": "many2one", "relation": "x_projetos", "label": "Project"},
                    "x_assigned_to": {"ttype": "many2one", "relation": "res.users", "label": "Assigned To"},
                    "x_stage_id": {"ttype": "many2one", "relation": "x_project_stage", "label": "Stage"},
                    "x_description": {"ttype": "html", "label": "Description"},
                    "x_date_start": {"ttype": "date", "label": "Start Date"},
                    "x_date_deadline": {"ttype": "date", "label": "Deadline"},
                    "x_priority": {
                        "ttype": "selection",
                        "label": "Priority",
                        "selection": "[('0', 'Low'), ('1', 'Normal'), ('2', 'High')]",
                    },
                    "x_status": {
                        "ttype": "selection",
                        "label": "Status",
                        "selection": "[('new', 'New'), ('in_progress', 'In Progress'), ('done', 'Done'), ('cancelled', 'Cancelled')]",
                    },
                },
            },
            "x_project_milestone": {
                "name": "Project Milestone",
                "fields": {
                    "x_name": {"ttype": "char", "label": "Milestone Name"},
                    "x_project_id": {"ttype": "many2one", "relation": "x_projetos", "label": "Project"},
                    "x_date": {"ttype": "date", "label": "Target Date"},
                    "x_description": {"ttype": "text", "label": "Description"},
                    "x_reached": {"ttype": "boolean", "label": "Reached"},
                },
            },
            "x_project_update": {
                "name": "Project Update",
                "fields": {
                    "x_project_id": {"ttype": "many2one", "relation": "x_projetos", "label": "Project"},
                    "x_author_id": {"ttype": "many2one", "relation": "res.users", "label": "Author"},
                    "x_name": {"ttype": "char", "label": "Subject"},
                    "x_description": {"ttype": "html", "label": "Update Text"},
                    "x_status": {
                        "ttype": "selection",
                        "label": "Status",
                        "selection": "[('on_track', 'On Track'), ('at_risk', 'At Risk'), ('off_track', 'Off Track'), ('on_hold', 'On Hold')]",
                    },
                    "x_created_date": {"ttype": "datetime", "label": "Created"},
                },
            },
            "x_project_tag": {
                "name": "Project Tag",
                "fields": {
                    "x_name": {"ttype": "char", "label": "Tag Name"},
                    "x_color": {"ttype": "integer", "label": "Color"},
                },
            },
            "x_project_collaborator": {
                "name": "Project Collaborator",
                "fields": {
                    "x_project_id": {"ttype": "many2one", "relation": "x_projetos", "label": "Project"},
                    "x_partner_id": {"ttype": "many2one", "relation": "res.partner", "label": "Partner"},
                    "x_user_id": {"ttype": "many2one", "relation": "res.users", "label": "User"},
                    "x_role": {"ttype": "char", "label": "Role"},
                },
            },
            "x_project_activity": {
                "name": "Project Activity",
                "fields": {
                    "x_project_id": {"ttype": "many2one", "relation": "x_projetos", "label": "Project"},
                    "x_user_id": {"ttype": "many2one", "relation": "res.users", "label": "User"},
                    "x_activity_type": {"ttype": "char", "label": "Activity Type"},
                    "x_summary": {"ttype": "char", "label": "Summary"},
                    "x_date": {"ttype": "datetime", "label": "Date"},
                },
            },
        }

        evidence: dict[str, Any] = {
            "task": "projetos-bootstrap-models",
            "timestamp": datetime.now().isoformat(),
            "status": "PENDING",
            "models_planned": len(models_to_create),
            "models_created": {},
            "models_existing": {},
            "fields_created": [],
            "skipped": [],
            "errors": [],
            "steps_completed": 0,
        }

        try:
            await self.client.authenticate()
            evidence["steps_completed"] += 1

            for model_name, model_cfg in models_to_create.items():
                try:
                    existing = await self.client.call(
                        "ir.model",
                        "search_read",
                        [[("model", "=", model_name)]],
                        {"fields": ["id"], "limit": 1},
                    )
                    if existing:
                        model_id = existing[0]["id"]
                        evidence["models_existing"][model_name] = model_id
                    else:
                        model_id = await self.client.call(
                            "ir.model",
                            "create",
                            [{"name": model_cfg["name"], "model": model_name, "state": "manual"}],
                        )
                        evidence["models_created"][model_name] = model_id

                    for field_name, field_cfg in model_cfg["fields"].items():
                        if field_name == "x_name":
                            continue
                        field_exists = await self.client.call(
                            "ir.model.fields",
                            "search_read",
                            [[("model_id", "=", model_id), ("name", "=", field_name)]],
                            {"fields": ["id"], "limit": 1},
                        )
                        if field_exists:
                            continue

                        payload: dict[str, Any] = {
                            "name": field_name,
                            "model_id": model_id,
                            "model": model_name,
                            "field_description": field_cfg["label"],
                            "ttype": field_cfg["ttype"],
                            "state": "manual",
                        }
                        if field_cfg.get("relation"):
                            relation_model = await self.client.call(
                                "ir.model",
                                "search_read",
                                [[("model", "=", field_cfg["relation"])]],
                                {"fields": ["id"], "limit": 1},
                            )
                            if not relation_model:
                                msg = (
                                    f"relation_missing:{model_name}.{field_name}:"
                                    f" {field_cfg['relation']}"
                                )
                                evidence["skipped"].append(msg)
                                evidence["errors"].append(msg)
                                continue
                            payload["relation"] = field_cfg["relation"]
                        if field_cfg.get("selection"):
                            payload["selection"] = field_cfg["selection"]

                        field_id = await self.client.call("ir.model.fields", "create", [payload])
                        evidence["fields_created"].append(
                            {"model": model_name, "field": field_name, "id": field_id}
                        )
                except Exception as ex:
                    evidence["errors"].append(f"{model_name}: {ex}")

            evidence["steps_completed"] += 1
            evidence["status"] = "PASSED" if not evidence["errors"] else "FAILED"
            evidence["log_file"] = str(await self._save_log(evidence))
            return evidence
        finally:
            await self.client.close()


__all__ = ["BootstrapProjetosModelsExecutor"]