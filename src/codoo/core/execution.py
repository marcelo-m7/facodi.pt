"""ExecutionProtocol: State machine for 8-stage feature delivery."""

import asyncio
from datetime import datetime, UTC
from typing import Any, Optional

from codoo.core.models import ExecutionReport, Gate, GateResult, Stage, StageResult


class ExecutionProtocol:
    """
    State machine implementing the deterministic 8-stage protocol.

    Enforces order:
    1. PLAN
    2. IMPLEMENT
    3. INSTALL
    4. API_TEST
    5. UI_TEST
    6. PERMISSION_TEST
    7. DOCUMENTATION
    8. REPORT
    """

    def __init__(self, spec_id: str, spec_title: str) -> None:
        """Initialize protocol with spec context."""
        self.spec_id = spec_id
        self.spec_title = spec_title
        self.current_stage = Stage.PLAN
        self.stages: dict[Stage, StageResult] = {}
        self.all_gates: list[GateResult] = []
        self.started_at = datetime.now(UTC)

    async def run_stage(
        self, stage: Stage, context: dict[str, Any]
    ) -> StageResult:
        """
        Execute a single stage.

        Args:
            stage: The stage to run
            context: Contextual data (e.g., Odoo client, module name)

        Returns:
            StageResult with gates checked
        """
        stage_start = datetime.now(UTC)

        # Validate stage ordering
        stage_order = [s for s in Stage]
        current_idx = stage_order.index(self.current_stage)
        new_idx = stage_order.index(stage)

        if new_idx < current_idx:
            raise ValueError(f"Cannot go backward from {self.current_stage} to {stage}")
        if new_idx > current_idx + 1:
            raise ValueError(
                f"Cannot skip stages. "
                f"Current: {self.current_stage}, Requested: {stage}"
            )

        # Run stage logic (stub; override in subclass)
        gate_results = await self._execute_stage_logic(stage, context)

        # Check if any gates failed
        passed = all(g.passed for g in gate_results)

        stage_result = StageResult(
            stage=stage,
            passed=passed,
            gates_checked=gate_results,
            duration_sec=(datetime.now(UTC) - stage_start).total_seconds(),
            notes=f"Stage {stage.value} completed with {len(gate_results)} gates",
        )

        self.stages[stage] = stage_result
        self.all_gates.extend(gate_results)
        self.current_stage = stage

        return stage_result

    async def _execute_stage_logic(
        self, stage: Stage, context: dict[str, Any]
    ) -> list[GateResult]:
        """
        Execute stage-specific logic and check gates.

        Override in subclass for actual implementation.
        """
        # Stub: just return empty gate results
        await asyncio.sleep(0.1)  # Simulate async work
        return []

    async def generate_report(self) -> ExecutionReport:
        """Generate final execution report."""
        completed_at = datetime.now(UTC)
        duration = (completed_at - self.started_at).total_seconds()

        all_passed = all(g.passed for g in self.all_gates)

        report = ExecutionReport(
            spec_id=self.spec_id,
            spec_title=self.spec_title,
            stages=list(self.stages.values()),
            gates=self.all_gates,
            started_at=self.started_at,
            completed_at=completed_at,
            duration_sec=duration,
            success=all_passed and self.current_stage == Stage.REPORT,
            summary=self._build_summary(),
        )

        return report

    def _build_summary(self) -> str:
        """Build human-readable summary of execution."""
        completed_stages = len(self.stages)
        passed_gates = sum(1 for g in self.all_gates if g.passed)
        total_gates = len(self.all_gates)

        return (
            f"Executed {completed_stages} stages, "
            f"{passed_gates}/{total_gates} gates passed. "
            f"Current: {self.current_stage.value}"
        )
