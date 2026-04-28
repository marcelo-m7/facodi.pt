"""Base operation class for Odoo automations."""

from abc import ABC, abstractmethod
from datetime import datetime
from pathlib import Path
from typing import Any, Optional

from codoo.core.evidence import save_evidence
from codoo.core.models import ExecutionReport, Gate, GateResult, TaskMode
from codoo.odoo.client import AsyncOdooClient


class OdooOperation(ABC):
    """
    Base class for Odoo operations (inspect, dry-run, apply, verify).

    All operations support deterministic mode flow:
    1. inspect() - diagnostics, no mutations
    2. dry_run() - show what would change
    3. apply() - commit changes
    4. verify() - validate post-apply state
    """

    def __init__(
        self,
        name: str,
        client: Optional[AsyncOdooClient] = None,
        evidence_dir: Path = Path("docs/logs"),
    ) -> None:
        """
        Initialize operation.

        Args:
            name: Operation name (e.g., 'ProductImportOperation')
            client: Async Odoo client
            evidence_dir: Directory for evidence logs
        """
        self.name = name
        self.client = client
        self.evidence_dir = Path(evidence_dir)
        self.started_at = datetime.utcnow()
        self.gates: list[GateResult] = []
        self.report: Optional[ExecutionReport] = None

    async def inspect(self) -> dict[str, Any]:
        """
        Inspect (diagnose) operation without making changes.

        Returns:
            Diagnostic data
        """
        result = await self._inspect_impl()
        await self._log_execution(mode=TaskMode.INSPECT, result=result)
        return result

    async def dry_run(self) -> dict[str, Any]:
        """
        Show what would change (no mutations).

        Returns:
            Projected changes
        """
        result = await self._dry_run_impl()
        await self._log_execution(mode=TaskMode.DRY_RUN, result=result)
        return result

    async def apply(self) -> dict[str, Any]:
        """
        Apply changes (commit mutations).

        Returns:
            Applied changes
        """
        result = await self._apply_impl()
        await self._log_execution(mode=TaskMode.APPLY, result=result)
        return result

    async def verify(self) -> dict[str, Any]:
        """
        Verify post-apply state.

        Returns:
            Verification results
        """
        result = await self._verify_impl()
        await self._log_execution(mode=TaskMode.VERIFY, result=result)
        return result

    @abstractmethod
    async def _inspect_impl(self) -> dict[str, Any]:
        """Override to implement inspect logic."""
        pass

    @abstractmethod
    async def _dry_run_impl(self) -> dict[str, Any]:
        """Override to implement dry-run logic."""
        pass

    @abstractmethod
    async def _apply_impl(self) -> dict[str, Any]:
        """Override to implement apply logic."""
        pass

    @abstractmethod
    async def _verify_impl(self) -> dict[str, Any]:
        """Override to implement verify logic."""
        pass

    async def _log_execution(
        self, mode: TaskMode, result: dict[str, Any]
    ) -> None:
        """
        Log execution as evidence.

        Args:
            mode: Execution mode
            result: Execution result
        """
        duration = (datetime.utcnow() - self.started_at).total_seconds()

        report = ExecutionReport(
            spec_id=self.name,
            spec_title=self.name,
            gates=self.gates,
            summary=f"{self.name} {mode.value}",
            duration_sec=duration,
            success=True,
        )

        # Save evidence log
        await save_evidence(
            report=report,
            evidence_dir=self.evidence_dir,
            task_name=self.name.lower().replace(" ", "_"),
            mode=mode.value,
        )

    def add_gate_result(self, gate_result: GateResult) -> None:
        """Add a gate validation result."""
        self.gates.append(gate_result)
