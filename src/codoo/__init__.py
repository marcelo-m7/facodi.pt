"""Codoo: Deterministic, AI-assisted Odoo development with full traceability."""

__version__ = "1.0.0"
__author__ = "Corvanis"
__email__ = "dev@corvanis.com"

from codoo.core.models import ExecutionReport, Gate, GateResult, SpecContract, Stage
from codoo.core.execution import ExecutionProtocol

__all__ = [
    "ExecutionProtocol",
    "ExecutionReport",
    "Gate",
    "GateResult",
    "SpecContract",
    "Stage",
]
