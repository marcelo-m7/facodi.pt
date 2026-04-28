"""Generate client invoices task."""

from typing import Any

from codoo.tasks.base import Task


class GenerateClientInvoicesTask(Task):
    """Generate invoices for clients from sale orders."""

    async def _inspect(self) -> dict[str, Any]:
        """Inspect sale orders that need invoicing."""
        return {
            "mode": "inspect",
            "sale_orders_found": 0,
            "invoiceable_orders": 0,
        }

    async def _dry_run(self) -> dict[str, Any]:
        """Show what invoices would be generated."""
        return {
            "mode": "dry-run",
            "invoices_to_generate": 0,
            "total_amount": 0.0,
        }

    async def _apply(self) -> dict[str, Any]:
        """Generate invoices."""
        return {
            "mode": "apply",
            "invoices_generated": 0,
        }

    async def _verify(self) -> dict[str, Any]:
        """Verify invoices were created."""
        return {
            "mode": "verify",
            "invoices_verified": 0,
        }
