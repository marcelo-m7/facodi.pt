"""Evidence logging for audit trails and traceability."""

import json
from datetime import datetime
from pathlib import Path
from typing import Optional

from codoo.core.models import ExecutionReport


async def save_evidence(
    report: ExecutionReport,
    evidence_dir: Path,
    task_name: str,
    mode: str = "execute",
) -> Path:
    """
    Save execution report as JSON evidence log.

    Args:
        report: ExecutionReport to log
        evidence_dir: Directory to save logs
        task_name: Name of task being executed
        mode: Execution mode (inspect, dry-run, apply, verify)

    Returns:
        Path to saved evidence file
    """
    # Create evidence directory if needed
    evidence_dir.mkdir(parents=True, exist_ok=True)

    # Generate filename: <task>_<mode>_<timestamp>.json
    timestamp = datetime.utcnow().strftime("%Y%m%dT%H%M%SZ")
    filename = f"{task_name}_{mode}_{timestamp}.json"
    filepath = evidence_dir / filename

    # Serialize report to JSON
    report_dict = report.model_dump(mode="json")

    # Write to file
    with open(filepath, "w") as f:
        json.dump(report_dict, f, indent=2, default=str)

    return filepath


def load_evidence(evidence_file: Path) -> ExecutionReport:
    """
    Load an evidence log file.

    Args:
        evidence_file: Path to JSON evidence log

    Returns:
        Deserialized ExecutionReport
    """
    with open(evidence_file, "r") as f:
        data = json.load(f)

    return ExecutionReport(**data)


def validate_evidence_dir(evidence_dir: Path) -> bool:
    """
    Validate that evidence directory is writable.

    Args:
        evidence_dir: Directory to check

    Returns:
        True if writable, False otherwise
    """
    try:
        evidence_dir.mkdir(parents=True, exist_ok=True)
        test_file = evidence_dir / ".test_write"
        test_file.write_text("test")
        test_file.unlink()
        return True
    except Exception:
        return False


def list_evidence_logs(
    evidence_dir: Path, task_name: Optional[str] = None
) -> list[Path]:
    """
    List evidence log files.

    Args:
        evidence_dir: Directory containing logs
        task_name: Optional filter by task name

    Returns:
        List of evidence log file paths
    """
    if not evidence_dir.exists():
        return []

    logs = sorted(evidence_dir.glob("*.json"), reverse=True)

    if task_name:
        logs = [log for log in logs if task_name in log.name]

    return logs


async def display_evidence(evidence_file: Path) -> None:
    """
    Pretty-print an evidence log.

    Args:
        evidence_file: Path to evidence log
    """
    report = load_evidence(evidence_file)

    print(f"\n{'=' * 80}")
    print(f"Evidence Log: {evidence_file.name}")
    print(f"{'=' * 80}\n")

    print(f"Spec ID: {report.spec_id}")
    print(f"Spec Title: {report.spec_title}")
    print(f"Status: {'✓ SUCCESS' if report.success else '✗ FAILED'}")
    print(f"Duration: {report.duration_sec:.2f}s")
    print(f"Started: {report.started_at}")
    print(f"Completed: {report.completed_at}\n")

    print("Stages Executed:")
    for stage in report.stages:
        status = "✓" if stage.passed else "✗"
        print(f"  {status} {stage.stage.value} ({stage.duration_sec:.2f}s)")

    print("\nGates Checked:")
    for gate in report.gates:
        status = "✓" if gate.passed else "✗"
        print(f"  {status} {gate.gate.value}")
        if not gate.passed and gate.error:
            print(f"     Error: {gate.error}")

    print(f"\nSummary: {report.summary}")
    print(f"{'=' * 80}\n")
