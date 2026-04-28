"""Task: discover and cache the full Odoo instance schema."""

from __future__ import annotations

from datetime import datetime
from pathlib import Path
from typing import Any

from codoo.agents.schema import OdooSchema, build_schema, PRIORITY_MODELS
from codoo.core.models import TaskMode
from codoo.odoo.client import AsyncOdooClient
from codoo.tasks.base import Task


class DiscoverSchemaTask(Task):
    """
    Discovers all models and server actions from an Odoo instance
    and saves a JSON schema manifest to docs/logs/.

    Modes:
      inspect  - authenticate and report model/action counts only
      dry-run  - discover full schema but do not save
      apply    - discover and save schema to docs/logs/
      verify   - load saved schema and print summary
    """

    def __init__(
        self,
        client: AsyncOdooClient,
        evidence_dir: Path = Path("docs/logs"),
        fetch_all_fields: bool = False,
    ) -> None:
        super().__init__("discover-schema", client, evidence_dir)
        self._fetch_all_fields = fetch_all_fields
        self._schema_path: Path | None = None

    async def _inspect(self) -> dict[str, Any]:
        """Quick count of models and server actions."""
        model_count: list[dict] = await self.client.call(
            "ir.model", "search_read", [[]], {"fields": ["model"], "limit": 0}
        )
        action_count: list[dict] = await self.client.call(
            "ir.actions.server", "search_read", [[]], {"fields": ["name"], "limit": 0}
        )
        return {
            "mode": "inspect",
            "host": self.client.host,
            "database": self.client.database,
            "uid": self.client.uid,
            "model_count": len(model_count),
            "server_action_count": len(action_count),
            "priority_models": sorted(PRIORITY_MODELS),
        }

    async def _dry_run(self) -> dict[str, Any]:
        """Discover full schema in memory without saving."""
        fetch_for = None if self._fetch_all_fields else PRIORITY_MODELS
        schema = await build_schema(self.client, fetch_fields_for=fetch_for)
        return {
            "mode": "dry-run",
            "model_count": len(schema.models),
            "server_action_count": len(schema.server_actions),
            "sample_models": list(schema.models.keys())[:20],
            "sample_actions": [sa.name for sa in schema.server_actions[:10]],
        }

    async def _apply(self) -> dict[str, Any]:
        """Discover full schema and save to docs/logs/schema_<db>_<ts>.json."""
        fetch_for = None if self._fetch_all_fields else PRIORITY_MODELS
        schema = await build_schema(self.client, fetch_fields_for=fetch_for)

        ts = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        out = self.evidence_dir / f"schema_{self.client.database}_{ts}.json"
        schema.save(out)
        self._schema_path = out

        return {
            "mode": "apply",
            "schema_file": str(out),
            "model_count": len(schema.models),
            "server_action_count": len(schema.server_actions),
            "priority_models_with_fields": [
                m for m in PRIORITY_MODELS if m in schema.models and schema.models[m].fields
            ],
        }

    async def _verify(self) -> dict[str, Any]:
        """Load and validate the most recent saved schema."""
        import glob

        pattern = str(self.evidence_dir / f"schema_{self.client.database}_*.json")
        files = sorted(glob.glob(pattern))
        if not files:
            return {"mode": "verify", "status": "no schema found", "hint": "Run apply first"}

        latest = Path(files[-1])
        schema = OdooSchema.load(latest)
        return {
            "mode": "verify",
            "schema_file": str(latest),
            "model_count": len(schema.models),
            "server_action_count": len(schema.server_actions),
            "priority_models_ok": [
                m for m in PRIORITY_MODELS if m in schema.models
            ],
            "priority_models_missing": [
                m for m in PRIORITY_MODELS if m not in schema.models
            ],
        }
