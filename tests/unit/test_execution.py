"""Unit tests for ExecutionProtocol."""

import pytest

from codoo.core.execution import ExecutionProtocol
from codoo.core.models import Stage


def test_execution_protocol_init():
    """Test ExecutionProtocol initialization."""
    protocol = ExecutionProtocol("FEAT-001", "Test Feature")
    assert protocol.spec_id == "FEAT-001"
    assert protocol.spec_title == "Test Feature"
    assert protocol.current_stage == Stage.PLAN


@pytest.mark.asyncio
async def test_execution_protocol_stage_progression():
    """Test stage progression follows order."""
    protocol = ExecutionProtocol("FEAT-002", "Test")

    # Run first stage
    result = await protocol.run_stage(Stage.PLAN, {})
    assert result.stage == Stage.PLAN
    assert protocol.current_stage == Stage.PLAN

    # Run next stage
    result = await protocol.run_stage(Stage.IMPLEMENT, {})
    assert result.stage == Stage.IMPLEMENT
    assert protocol.current_stage == Stage.IMPLEMENT


@pytest.mark.asyncio
async def test_execution_protocol_backward_transition_fails():
    """Test backward stage transitions are blocked."""
    protocol = ExecutionProtocol("FEAT-003", "Test")

    # Run to IMPLEMENT
    await protocol.run_stage(Stage.PLAN, {})
    await protocol.run_stage(Stage.IMPLEMENT, {})

    # Try to go back to PLAN — should fail
    with pytest.raises(ValueError, match="Cannot go backward"):
        await protocol.run_stage(Stage.PLAN, {})


@pytest.mark.asyncio
async def test_execution_protocol_skip_stage_fails():
    """Test skipping stages is not allowed."""
    protocol = ExecutionProtocol("FEAT-004", "Test")

    # Try to skip from PLAN to INSTALL
    with pytest.raises(ValueError, match="Cannot skip stages"):
        await protocol.run_stage(Stage.INSTALL, {})


@pytest.mark.asyncio
async def test_execution_protocol_generate_report():
    """Test report generation."""
    protocol = ExecutionProtocol("FEAT-005", "Test")

    await protocol.run_stage(Stage.PLAN, {})
    await protocol.run_stage(Stage.IMPLEMENT, {})

    report = await protocol.generate_report()
    assert report.spec_id == "FEAT-005"
    assert len(report.stages) == 2
    assert report.started_at is not None
