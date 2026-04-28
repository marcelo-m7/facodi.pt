# Codoo v1.0 Architecture

## Overview

Codoo v1.0 is a **deterministic, AI-assisted Odoo development framework** built on:
- **8-stage execution protocol** (repeatable, enforced order)
- **Type-safe Python 3.13+** (async-first, pydantic, full validation)
- **Task-based automation** (inspect → dry-run → apply → verify)
- **Evidence logging** (JSON audit trails for compliance)

## Core Principles

### 1. Determinism
Every feature execution follows the same 8-stage protocol:
1. PLAN → 2. IMPLEMENT → 3. INSTALL → 4. API_TEST → 5. UI_TEST → 6. PERMISSION_TEST → 7. DOCUMENTATION → 8. REPORT

No skipping, reordering, or backward transitions allowed.

### 2. Type Safety
All code is **100% type-hinted** and validated with Pydantic. Configuration, models, API responses, and task I/O are all validated.

### 3. Evidence
Every operation produces JSON evidence logs in `docs/logs/` for full auditability.

## Architecture Layers

```
┌──────────────────────────────────────┐
│ CLI (Typer)                          │ src/codoo/__main__.py
│  - codoo task run                    │
│  - codoo spec validate               │
│  - codoo evidence show               │
└─────────────┬────────────────────────┘
              │
┌─────────────▼────────────────────────┐
│ CORE METHODOLOGY                     │ src/codoo/core/
│  - ExecutionProtocol (8-stage)       │  ├── models.py
│  - Gates (install, api, ui, perms)   │  ├── execution.py
│  - Evidence logging                  │  └── gates.py
└──────────────┬───────────────────────┘
       ┌───────┴────────┐
       │                │
    TASKS            ODOO LAYER
  (domain-         (Async client)
   organized)    - AsyncOdooClient
   - products/  - XML-RPC API
   - invoices/  - ORM models
   - projects/  - Operations base
```

## Module Reference

| Path | Purpose |
|------|---------|
| `src/codoo/core/models.py` | Pydantic models (Stage, Gate, ExecutionReport) |
| `src/codoo/core/execution.py` | ExecutionProtocol state machine |
| `src/codoo/core/gates.py` | Gate validators (async) |
| `src/codoo/odoo/client.py` | AsyncOdooClient (httpx-based, async XML-RPC) |
| `src/codoo/tasks/base.py` | Task base class (inspect/dry-run/apply/verify) |
| `src/codoo/tasks/products/` | Product import, audit, BoM tasks |
| `src/codoo/tasks/invoices/` | Invoice generation tasks |
| `src/codoo/tasks/projects/` | Project setup tasks |
| `src/codoo/adapters/odoo.py` | Client factory |
| `src/codoo/ports/cli.py` | Typer CLI implementation |
| `tests/` | pytest suite (conftest, unit, integration) |

## Execution Flow

### Task Execution (Deterministic Modes)

```
User: codoo task run --name import-products --mode inspect

ProductImportTask
  .run(TaskMode.INSPECT)
    → _inspect() (no mutations, just diagnostics)
    → save_evidence() → docs/logs/productimporttask_inspect_20260427T163045Z.json
    → return { "mode": "inspect", "products_found": 0 }
```

### 8-Stage Protocol

```
ExecutionProtocol(spec_id="FEAT-001")
  .run_stage(Stage.PLAN, context)
  .run_stage(Stage.IMPLEMENT, context)
  .run_stage(Stage.INSTALL)  ← validate_install()
  .run_stage(Stage.API_TEST)  ← validate_api_crud()
  .run_stage(Stage.UI_TEST)   ← validate_ui_interaction()
  .run_stage(Stage.PERMISSION_TEST) ← validate_permissions()
  .run_stage(Stage.DOCUMENTATION)
  .run_stage(Stage.REPORT)
  .generate_report() → ExecutionReport JSON
```

## Evidence Logging

Every operation produces `docs/logs/<task>_<mode>_<timestamp>.json`:

```json
{
  "spec_id": "ProductImportTask",
  "stages": [...],
  "gates": [{"gate": "install", "passed": true, "duration_sec": 0.234}],
  "summary": "Task completed",
  "success": true,
  "duration_sec": 1.5
}
```

## Type Safety

All inputs validated at entry points:

```python
config = load_config()  # Raises ConfigurationError if invalid
spec = await load_and_validate_spec(spec_file)  # Raises SpecValidationError
```

## Testing

```bash
pytest tests/ --cov=src/codoo  # Unit + integration tests
```

Target: ≥80% coverage on `core/` and `gates/`, ≥50% on `tasks/`.

## Adding New Features

### New Task
1. Create `src/codoo/tasks/<domain>/<task>.py`
2. Inherit from `Task` base class
3. Implement: `_inspect()`, `_dry_run()`, `_apply()`, `_verify()`
4. Register in CLI

### New Operation
1. Create `src/codoo/odoo/operations/<operation>.py`
2. Inherit from `OdooOperation`
3. Implement operation logic + gates

---

See [SETUP.md](SETUP.md) for development environment and [MIGRATION.md](MIGRATION.md) for migrating legacy scripts.
