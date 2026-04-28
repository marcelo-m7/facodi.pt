"""Core Codoo models: 8-stage protocol, gates, evidence."""

from datetime import datetime
from enum import Enum
from typing import Any, Optional

from pydantic import BaseModel, Field


class Stage(str, Enum):
    """8-stage execution protocol."""

    PLAN = "plan"
    IMPLEMENT = "implement"
    INSTALL = "install"
    API_TEST = "api_test"
    UI_TEST = "ui_test"
    PERMISSION_TEST = "permission_test"
    DOCUMENTATION = "documentation"
    REPORT = "report"


class Gate(str, Enum):
    """Validation gates required before stage transition."""

    INSTALL = "install"
    API_CRUD = "api_crud"
    UI_INTERACTION = "ui_interaction"
    PERMISSIONS = "permissions"
    NO_JS_ERRORS = "no_js_errors"
    DOCUMENTATION = "documentation"


class TaskMode(str, Enum):
    """Deterministic task execution modes."""

    INSPECT = "inspect"
    DRY_RUN = "dry-run"
    APPLY = "apply"
    VERIFY = "verify"


class GateResult(BaseModel):
    """Result of a single gate validation."""

    gate: Gate
    passed: bool
    evidence: dict[str, Any] = Field(default_factory=dict)
    error: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    duration_sec: float = 0.0


class StageResult(BaseModel):
    """Result of executing a single stage."""

    stage: Stage
    passed: bool
    gates_checked: list[GateResult] = Field(default_factory=list)
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    duration_sec: float = 0.0
    notes: str = ""


class ExecutionReport(BaseModel):
    """Complete execution report with all stages and gates."""

    spec_id: str
    spec_title: str
    stages: list[StageResult] = Field(default_factory=list)
    gates: list[GateResult] = Field(default_factory=list)
    summary: str = ""
    started_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None
    duration_sec: float = 0.0
    success: bool = False

    class Config:
        json_encoders = {datetime: lambda v: v.isoformat()}


class SpecContract(BaseModel):
    """YAML feature specification contract."""

    id: str = Field(..., description="Feature ID (e.g., FEAT-001)")
    title: str = Field(..., description="Feature title")
    scope: dict[str, Any] = Field(default_factory=dict, description="Feature scope")
    models: list[str] = Field(default_factory=list, description="Impacted Odoo models")
    views: list[str] = Field(default_factory=list, description="Impacted views")
    dependencies: list[str] = Field(default_factory=list, description="Module dependencies")
    gates_required: list[Gate] = Field(
        default_factory=lambda: [g for g in Gate], description="Required validation gates"
    )
    notes: str = ""
