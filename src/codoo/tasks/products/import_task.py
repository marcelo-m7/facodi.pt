"""Product import task."""

from typing import Any

from codoo.tasks.base import Task


class ProductImportTask(Task):
    """Import products into Odoo from prepared data files."""

    async def _inspect(self) -> dict[str, Any]:
        """Inspect product data source."""
        return {
            "mode": "inspect",
            "products_found": 0,
            "data_files": [],
            "ready": False,
        }

    async def _dry_run(self) -> dict[str, Any]:
        """Show what products would be imported."""
        return {
            "mode": "dry-run",
            "products_to_import": 0,
            "estimated_duration_sec": 0,
        }

    async def _apply(self) -> dict[str, Any]:
        """Apply product import."""
        return {
            "mode": "apply",
            "products_imported": 0,
            "errors": [],
        }

    async def _verify(self) -> dict[str, Any]:
        """Verify imported products exist in Odoo."""
        return {
            "mode": "verify",
            "products_verified": 0,
            "discrepancies": [],
        }
