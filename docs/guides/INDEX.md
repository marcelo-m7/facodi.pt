# Documentation Index

This index reflects the current refactored Codoo structure.

## Start Here

1. ../../README.md
2. ../../AGENTS.md
3. CODOO.md
4. ARCHITECTURE.md
5. CONTRIBUTING.md

## Core Guides

- CODOO.md: deterministic methodology and gate model
- ARCHITECTURE.md: runtime structure (CLI, core, tasks, Odoo layer)
- CONTRIBUTING.md: branch/commit flow and validation expectations
- SETUP.md: environment and setup details
- SECURITY.md: credential and secure coding guardrails
- FAQ.md: troubleshooting and recurring questions
- ODOO-SAAS-LIMITATIONS.md: SaaS constraints and fallback strategy
- MIGRATION.md: migration notes from legacy scripts to task system
- CHANGELOG.md: release history and notable changes

## Feature and Evidence Area

- ../features/: feature artifacts and reporting assets
  - spec-FEAT-VAL-001.yaml: Smart Field Validation
  - spec-FEAT-AUDIT-001.yaml: Audit Trail & Change History
  - spec-FEAT-APPROVE-001.yaml: Workflow & Approvals
- ../plans/: planning & roadmap documents
  - 2026-04-27-studio-app-features-brainstorm.md: All 10 feature ideas
  - 2026-04-27-roadmap-implementation.md: Detailed roadmap + timeline
  - QUICK_REFERENCE.md: Quick start guide for development
- ../logs/: execution evidence JSON logs

## Automation and Code Areas

- ../../src/codoo/tasks/: operational task implementations
- ../../src/codoo/core/: protocol, gate, and report models
- ../../src/codoo/odoo/: Odoo API adapters and integrations
- ../../addon/: Odoo addon submodule (separate git history)

## Recommended Reading Order by Role

### Agent/LLM

1. ../../AGENTS.md
2. CODOO.md
3. ARCHITECTURE.md
4. CONTRIBUTING.md

### Developer

1. ../../README.md
2. SETUP.md
3. ARCHITECTURE.md
4. CONTRIBUTING.md
5. SECURITY.md

### Reviewer

1. CODOO.md
2. CONTRIBUTING.md
3. SECURITY.md
4. CHANGELOG.md

## Notes

- Prefer linking to canonical guides instead of duplicating long instructions.
- Keep docs/odoo/ and docs/documentation/ unchanged unless explicitly requested.
