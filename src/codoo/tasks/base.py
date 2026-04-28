"""Base task class for deterministic task runners."""

from abc import ABC, abstractmethod
from datetime import datetime
from pathlib import Path
from typing import Any, Optional

from codoo.core.evidence import save_evidence
from codoo.core.models import ExecutionReport, TaskMode
from codoo.odoo.client import AsyncOdooClient


class Task(ABC):
    """
    Base class for all Codoo tasks.

    Enforces deterministic mode flow: inspect → dry-run → apply → verify.
    All outputs go to docs/logs/ as evidence JSON.
    """

    def __init__(
        self,
        name: str,
        client: Optional[AsyncOdooClient] = None,
        evidence_dir: Path = Path("docs/logs"),
    ) -> None:
        """
        Initialize task.

        Args:
            name: Task name
            client: Async Odoo client (optional)
            evidence_dir: Evidence directory
        """
        self.name = name
        self.client = client
        self.evidence_dir = Path(evidence_dir)

    async def run(self, mode: TaskMode) -> dict[str, Any]:
        """
        Run task in specified mode.

        Args:
            mode: Task execution mode

        Returns:
            Task result dict
        """
        start = datetime.utcnow()

        try:
            if mode == TaskMode.INSPECT:
                result = await self._inspect()
            elif mode == TaskMode.DRY_RUN:
                result = await self._dry_run()
            elif mode == TaskMode.APPLY:
                result = await self._apply()
            elif mode == TaskMode.VERIFY:
                result = await self._verify()
            else:
                raise ValueError(f"Unknown mode: {mode}")

            # Log execution
            duration = (datetime.utcnow() - start).total_seconds()
            report = ExecutionReport(
                spec_id=self.name,
                spec_title=self.name,
                duration_sec=duration,
                success=True,
                summary=f"{self.name} {mode.value} completed successfully",
            )
            await save_evidence(report, self.evidence_dir, self.name.lower().replace(" ", "_"), mode.value)

            return result

        except Exception as e:
            duration = (datetime.utcnow() - start).total_seconds()
            report = ExecutionReport(
                spec_id=self.name,
                spec_title=self.name,
                duration_sec=duration,
                success=False,
                summary=f"{self.name} {mode.value} failed: {str(e)}",
            )
            await save_evidence(report, self.evidence_dir, self.name.lower().replace(" ", "_"), mode.value)
            raise

    @abstractmethod
    async def _inspect(self) -> dict[str, Any]:
        """Override: implement inspect logic."""
        pass

    @abstractmethod
    async def _dry_run(self) -> dict[str, Any]:
        """Override: implement dry-run logic."""
        pass

    @abstractmethod
    async def _apply(self) -> dict[str, Any]:
        """Override: implement apply logic."""
        pass

    @abstractmethod
    async def _verify(self) -> dict[str, Any]:
        """Override: implement verify logic."""
        pass
