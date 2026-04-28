"""Unit tests for Codoo core models."""

import pytest
from datetime import datetime

from codoo.core.models import (
    ExecutionReport,
    Gate,
    GateResult,
    SpecContract,
    Stage,
    StageResult,
    TaskMode,
)


def test_stage_enum():
    """Test Stage enum values."""
    assert Stage.PLAN.value == "plan"
    assert Stage.IMPLEMENT.value == "implement"
    assert Stage.INSTALL.value == "install"


def test_gate_enum():
    """Test Gate enum values."""
    assert Gate.INSTALL.value == "install"
    assert Gate.API_CRUD.value == "api_crud"


def test_task_mode_enum():
    """Test TaskMode enum values."""
    assert TaskMode.INSPECT.value == "inspect"
    assert TaskMode.DRY_RUN.value == "dry-run"
    assert TaskMode.APPLY.value == "apply"
    assert TaskMode.VERIFY.value == "verify"


def test_gate_result_creation():
    """Test GateResult model creation."""
    result = GateResult(
        gate=Gate.INSTALL,
        passed=True,
        evidence={"module": "product"},
    )
    assert result.gate == Gate.INSTALL
    assert result.passed is True
    assert result.evidence["module"] == "product"


def test_gate_result_json_serialization():
    """Test GateResult can be serialized to JSON."""
    result = GateResult(
        gate=Gate.API_CRUD,
        passed=False,
        error="Connection timeout",
    )
    data = result.model_dump(mode="json")
    assert data["gate"] == "api_crud"
    assert data["passed"] is False
    assert data["error"] == "Connection timeout"


def test_stage_result_creation():
    """Test StageResult model creation."""
    gate1 = GateResult(gate=Gate.INSTALL, passed=True)
    gate2 = GateResult(gate=Gate.API_CRUD, passed=False)

    stage = StageResult(
        stage=Stage.INSTALL,
        passed=False,
        gates_checked=[gate1, gate2],
    )
    assert stage.stage == Stage.INSTALL
    assert stage.passed is False
    assert len(stage.gates_checked) == 2


def test_execution_report_creation():
    """Test ExecutionReport model creation."""
    report = ExecutionReport(
        spec_id="FEAT-001",
        spec_title="Test Feature",
        summary="All tests passed",
        success=True,
    )
    assert report.spec_id == "FEAT-001"
    assert report.spec_title == "Test Feature"
    assert report.success is True
    assert len(report.stages) == 0


def test_spec_contract_creation():
    """Test SpecContract model creation."""
    spec = SpecContract(
        id="FEAT-002",
        title="Import Products",
        models=["product.product", "product.template"],
        gates_required=[Gate.INSTALL, Gate.API_CRUD],
    )
    assert spec.id == "FEAT-002"
    assert len(spec.models) == 2
    assert len(spec.gates_required) == 2


def test_spec_contract_defaults():
    """Test SpecContract default values."""
    spec = SpecContract(id="FEAT-003", title="Test")
    assert spec.scope == {}
    assert spec.models == []
    assert spec.views == []
    assert len(spec.gates_required) > 0  # All gates by default
