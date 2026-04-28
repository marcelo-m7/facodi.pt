---
name: codoo-methodology
description: Use when implementing, validating, or reviewing Codoo features and Odoo instance configuration tasks for Corvanis clients, especially for FEAT specs, execution gates, evidence logs, SaaS constraints, and deterministic delivery.
---

# Codoo Methodology

Reference workflow for deterministic feature delivery and Odoo configuration work in this repository.

## When to Use

- Building a new FEAT spec implementation
- Validating readiness of a delivered feature
- Handling SaaS constraints during addon installation
- Reviewing whether a task is complete and auditable

## When Not to Use

- Small exploratory tasks with no implementation or validation gates
- Purely stylistic edits that do not affect behavior

## Core Model

Codoo uses a specs-before-code contract with deterministic execution:

1. Spec contract defines scope and acceptance gates.
2. Implementation happens in small, reviewable increments.
3. Validation gates prove behavior (install, API, UI, permissions).
4. Evidence logs capture pass or fail details.
5. Feature report summarizes outcomes and limitations.

## Execution Loop (Operator View)

1. Load feature context from `docs/features/spec-FEAT-[ID].yaml`.
2. Identify impacted zones: `addon/`, `src/codoo/tasks/`, `workspace/data/`, `docs/logs/`, docs.
3. Implement in small increments with immediate validation per change.
4. Run mandatory gates and collect evidence artifacts.
5. Report outcome with explicit pass/fail per gate and unresolved risks.

See detailed checklist: `references/feature-execution-checklist.md`.

## Gate Checklist

Use this checklist before claiming completion:

- Install or upgrade gate passed
- API CRUD gate passed
- UI interaction gate passed
- Browser console gate passed (no relevant JS errors)
- Permissions gate passed
- Evidence files stored in `docs/logs/`
- Feature report updated in `docs/features/`

## SaaS Limitation Handling

If Odoo SaaS blocks custom Python behavior:

- Record failure evidence and exact error
- Re-run up to 3 times only when a concrete fix is applied
- If still blocked, document a supported fallback:
  - API-first path
  - Native Odoo configuration alternative
  - Explicit hard limitation with rationale

Use the report format in `references/saas-limitation-report-template.md`.

## Dual-Repo Guardrail

- Changes in `addon/` belong to marcor and must be committed in submodule context.
- Root repository changes belong to Codoo and must be committed from root.
- Keep root and submodule references synchronized when both are modified.

## Anti-Patterns to Avoid

- Marking task complete without evidence files.
- Treating HTTP 405 on XML-RPC GET as outage without `authenticate()` check.
- Logging credentials or sensitive `.env` values.
- Skipping permission validation because CRUD succeeded as admin.

## References

- [AGENTS.md](../../../AGENTS.md)
- [docs/guides/CODOO.md](../../../docs/guides/CODOO.md)
- [docs/guides/CONTRIBUTING.md](../../../docs/guides/CONTRIBUTING.md)
- [docs/guides/ARCHITECTURE.md](../../../docs/guides/ARCHITECTURE.md)
- [docs/guides/ODOO-SAAS-LIMITATIONS.md](../../../docs/guides/ODOO-SAAS-LIMITATIONS.md)
- [references/feature-execution-checklist.md](references/feature-execution-checklist.md)
- [references/saas-limitation-report-template.md](references/saas-limitation-report-template.md)
