# AGENTS.md

Agent onboarding for this workspace. Keep this file concise and use linked docs for deep details.

## 0) What is Codoo?

**Codoo** = **C**orvanis + **Odoo** = A methodology for deterministic, AI-assisted Odoo development with full traceability.

**Core proposition:** Prevent context loss, code conflicts, and validation gaps when multiple developers or agents work on Odoo projects. Achieves this through:
- **Specs-before-code**: YAML feature contracts define the input contract (scope, models, views, security, dependencies)
- **8-stage execution protocol**: Same deterministic workflow, same order, every delivery (plan → implement → validate → report)
- **Mandatory validation gates**: Install, API CRUD, permissions, UI flow, no JS errors, documentation — all gates must pass
- **Evidence logging**: JSON logs prove each gate passed (full audit trail for compliance and debugging)
- **SaaS-aware**: API-first fallbacks when Python addons fail on Odoo SaaS (workaround or hard limitation documented)

**Not a code generator.** Codoo requires human review and domain knowledge; specs + protocol = reproducible, traceable outcomes.

## 1) Mission and Boundaries

This repository (`Corvanis/Codoo`) is the orchestration layer for Odoo delivery. It contains specs, task implementations, validation artifacts, and docs. Odoo addon code lives in the `addon/` git subrepository (Corvanis/marcor).

Read first:
- [README.md](README.md)
- [docs/guides/CODOO.md](docs/guides/CODOO.md)
- [docs/guides/ARCHITECTURE.md](docs/guides/ARCHITECTURE.md)
- [docs/features/PHASE_6_7_EXECUTION_REPORT.md](docs/features/PHASE_6_7_EXECUTION_REPORT.md)
- [docs/guides/CONTRIBUTING.md](docs/guides/CONTRIBUTING.md)

**How Codoo design enables AI agents:**
- **Specs** provide unambiguous input contracts (vs. vague text requirements)
- **Protocol** defines deterministic, repeatable workflow (same 8 stages, same order)
- **Gates** create objective pass/fail criteria (install succeeds, API works, UI flows, no errors)
- **Evidence logs** allow agents to validate their own work (JSON proof for each gate)
- **Skills** bundle domain knowledge (odoo-19, payment-integration, etc.) for instant productivity

### Read-Only Mirrors (Boundary)

Treat these trees as vendor/documentation mirrors and keep them read-only unless the user explicitly asks for edits:
- `docs/odoo/**`
- `docs/documentation/**`

This design allows agents to work independently on features while maintaining human oversight at critical review points.

Agent customization map (read before editing):
- Base onboarding: [AGENTS.md](AGENTS.md)
- File-scoped rules: [.github/instructions/](.github/instructions/)
- Reusable task prompts: [.github/prompts/](.github/prompts/)
- Specialized subagent: [.github/agents/odoo-feature-executor.agent.md](.github/agents/odoo-feature-executor.agent.md)
- Local domain skills: [.agents/skills/](.agents/skills/)

## 2) Dual-Repo Rule (Critical)

**Architecture:** Codoo (root, orchestration) + Marcor (addon/, implementation). They have separate remotes and commits.

If `addon/` appears empty in a fresh checkout, initialize submodules first:

```powershell
git submodule update --init --recursive
```

```
Corvanis/Codoo (root)              Corvanis/marcor (addon/ submodule)
├── src/codoo/                     ├── addon/codoo/
│   ├── tasks/                     ├── addon/corvanis_certificates/
│   └── core/                      └── addon/[other modules]/
├── workspace/
│   └── data/
├── docs/
└── .agents/skills/
```

**Commit rules:**
- Changes under `addon/` belong to the marcor repository and must be committed/pushed from `addon/`.
- Changes outside `addon/` (for example `src/codoo/`, `docs/`, `workspace/`, root configs) belong to this Codoo repository and must be committed/pushed from root.
- Do not leave root and `addon/` out of sync when the task affects both.
- For practical branch/commit/push examples in each repo, follow [docs/guides/CONTRIBUTING.md](docs/guides/CONTRIBUTING.md) and [.github/prompts/codoo-dual-repo-commit.prompt.md](.github/prompts/codoo-dual-repo-commit.prompt.md).

**Quick drift checks** (after mixed root + `addon/` work):

```powershell
# In root
git status addon/
git submodule foreach git status

# If addon has local commits, push from addon/ first, then commit root submodule pointer:
git add addon/
git commit -m "chore: sync addon submodule pointer"
```

## 3) Agent Workspace Structure

The `workspace/` directory is dedicated to execution context and supporting artifacts:
- `workspace/data/` - Domain-specific working data (CSV, Excel, JSON, PDFs)
  - `workspace/data/fame/` - FAME builders data and resources
  - `workspace/data/facodi/` - FACODI e-learning data and resources
- `workspace/docs/` - Working notes and architecture drafts

The workspace is meant to be mutable during agent operations but is versioned in git:
- `.gitignore` tracks `workspace/data/*` to prevent large binary artifacts
- Logs, reports, and evidence go to `docs/logs/` (committed)
- Intermediate data stays in `workspace/data/` (gitignored)

Implementation code for automation now lives in `src/codoo/tasks/` and is executed via CLI.

## 4) Fast Start Commands

**Environment setup** (run once per workspace):

```powershell
python -m venv .venv
& .venv\Scripts\Activate.ps1
python --version
# Configure credentials
Copy-Item .env.example .env
# Edit .env and set ODOO_HOST, ODOO_DB, ODOO_USERNAME, ODOO_PASSWORD
```

```bash
python -m venv .venv
source .venv/bin/activate
python --version
# Configure credentials
cp .env.example .env
# Edit .env and set ODOO_HOST, ODOO_DB, ODOO_USERNAME, ODOO_PASSWORD
```

**First-session preflight** (before any implementation):

```powershell
python --version
git --version
Test-Path ".venv\Scripts\Activate.ps1"
python -c "import xmlrpc.client; print('xmlrpc: OK')"
Test-Path ".env"
```

```bash
python --version
git --version
test -f .venv/bin/activate || test -f .venv/Scripts/Activate.ps1
python -c "import xmlrpc.client; print('xmlrpc: OK')"
test -f .env
```

If `.env` is missing, create it from `.env.example` before proceeding.

**Connectivity and diagnostics** (always run first when starting a session):

```powershell
# Validate package + CLI
pip install -e .
python -m codoo --help
python -m codoo task list
```

**Notes:**
- Operational automation is task-based under `src/codoo/tasks/`
- Use `python -m codoo task run --name <task-name> --mode <mode>`
- For `.env` troubleshooting, see [docs/guides/FAQ.md](docs/guides/FAQ.md#env-setup)

## 5) Feature Execution Contract

For feature work, a YAML spec is the source of truth. The contract is binding: all features must follow the deterministic protocol documented in [docs/guides/CODOO.md](docs/guides/CODOO.md).

**Spec vs. Report:**
- **Spec:** `docs/features/spec-FEAT-[ID].yaml` (create from team-approved format)
- **Report:** `docs/features/feature-[ID].md` or phased execution reports in `docs/features/`

**Mandatory execution gates** (all required):
1. Read spec fully and plan impacted files + risks.
2. Implement in small, reviewable commits on feature branch.
3. Validate **install/upgrade** of module in target Odoo instance.
4. Validate **API CRUD operations** with evidence JSON logs.
5. Validate **UI interactions** and check browser console for errors.
6. Validate **permissions and access rules** work as specified.
7. Document evidence in `docs/logs/` and commit log JSON files.
8. Generate feature report and create PR with execution protocol summary.

**Agent Responsibilities:**
- **Lead:** Implement all 8 stages in sequence; never skip gates.
- **Document:** Save evidence (JSON logs, screenshots) for each gate before moving to the next.
- **Validate own work:** Use logs and UI tests to confirm gates pass; if any gate fails, fix and re-run.
- **Escalate failures:** After 3 re-runs, document root cause (SaaS limitation, platform constraint, data issue) and propose API-only workaround or hard limitation.
- **Handoff:** Generate feature report with gate evidence and create PR; human reviewer approves feature readiness.

**Failure recovery:**
- If any gate fails, fix and re-run the entire sequence up to 3 times.
- On 3rd failure, document root cause and propose workaround or hard limitation.
- Never skip gates or declare feature "done" without all gates passing.

See also: [PHASE_6_7_EXECUTION_REPORT.md](docs/features/PHASE_6_7_EXECUTION_REPORT.md)

## 6) Task System and Naming Conventions

All operational automation lives in `src/codoo/tasks/` organized by domain:
- `products/`, `invoices/`, `projects/`, `contacts/`, `config/`, `data/`, `analysis/`, `reporting/`
- Add new tasks as Python modules inheriting from `codoo.tasks.base.Task`

For tasks that can mutate Odoo data, use deterministic mode order:
1. `inspect` (or compatibility checks)
2. `dry-run`
3. `apply`
4. `verify`

Write evidence to `docs/logs/<task>_<mode>_<timestamp>.json` and never print secrets in console output.

Evidence and logs from task runs must be written to `docs/logs/` (committed).

Addon structure (inside `addon/<module>/`):
- `__manifest__.py`, `__init__.py`
- `models/`, `views/`, `security/`, `data/`

See [addon/README.md](addon/README.md) and [docs/guides/CONTRIBUTING.md](docs/guides/CONTRIBUTING.md).

## 7) Studio App Lifecycle (API-First)

For Odoo SaaS app prototyping and rollback-safe delivery, use the built-in Studio lifecycle commands in order.

### Lifecycle Commands

```bash
# 1) Create app (model + views + action + menu + ACL)
python -m codoo studio create-app --name "My App" --model x_my_app

# 2) Validate current app inventory and health
python -m codoo studio list-apps

# 3) Repair existing app if visibility/ACL issues appear
python -m codoo studio repair-app --model x_my_app

# 4) Plan deletion safely (dry-run default)
python -m codoo studio delete-app --model x_my_app

# 5) Apply deletion with full cleanup
python -m codoo studio delete-app --model x_my_app --yes

# Optional: include ir.actions.server cleanup
python -m codoo studio delete-app --model x_my_app --yes --include-server-actions
```

### What "Complete Cleanup" Means

`delete-app --yes` removes app-linked records in deterministic order:
1. `ir.ui.menu` (menus linked to app actions)
2. `ir.actions.act_window`
3. `ir.ui.view`
4. `ir.model.access`
5. optional `ir.actions.server`
6. manual `ir.model.fields`
7. `ir.model`

### Evidence Requirements

- Keep command output evidence in `docs/logs/` (auto-generated by CLI)
- Prefer dry-run before destructive operations
- Use rollback flow during testing instead of manual DB edits

## 8) Known Pitfalls

### Credentials & Security
- **Never commit `.env` files.** It's in `.gitignore` for a reason — use `.env.example` as template.
- If credentials are accidentally committed, revoke them immediately and run: `git filter-branch --tree-filter 'rm -f .env' HEAD`

### Odoo Connectivity
- **XML-RPC tests:** Use `common.authenticate(db, user, pwd, {})` to validate credentials. DO NOT use HTTP GET checks — XML-RPC endpoints return 405 on GET.
- **SaaS limitations:** Odoo SaaS may reject or partially install custom Python addons. When platform-limited, document evidence and propose: (a) API-only workaround, (b) alternative native feature, or (c) hard limitation with justification.

### Code Quality
- **Python syntax:** After large edits, run `python -m py_compile <file>` to catch indentation/syntax regressions before committing.
- **Browser console:** During UI validation, always check browser console (F12 → Console tab) for JS errors — they may hide failures.

### PowerShell & Terminal
- **Non-interactive scripts:** In automation, prefer `Invoke-WebRequest ... -UseBasicParsing` to avoid interactive prompts that can block CI/CD.
- **Branch confusion:** Always confirm `git status` shows the correct branch before pushing — feature branches must NOT merge directly into `main`.

### Git Workflow (Dual-Repo)
- **Two remotes:** `addon/` is a git submodule pointing to Corvanis/marcor. Changes to addon code must be committed/pushed from within `addon/`, then the parent repo must commit the submodule reference.
- **Out-of-sync risk:** If you modify both root and `addon/` in the same feature, test the submodule link after pushing to avoid orphaned commits.
- For step-by-step examples, see [docs/guides/CONTRIBUTING.md](docs/guides/CONTRIBUTING.md).

Security and troubleshooting references:
- [docs/guides/SECURITY.md](docs/guides/SECURITY.md)
- [docs/guides/FAQ.md](docs/guides/FAQ.md)

## 9) Where to Look Next

- Architecture and boundaries: [docs/guides/ARCHITECTURE.md](docs/guides/ARCHITECTURE.md)
- Contribution workflow and commit patterns: [docs/guides/CONTRIBUTING.md](docs/guides/CONTRIBUTING.md)
- Feature examples with evidence: [docs/features/PHASE_6_7_EXECUTION_REPORT.md](docs/features/PHASE_6_7_EXECUTION_REPORT.md)
- SaaS limitations and fallback policy: [docs/guides/ODOO-SAAS-LIMITATIONS.md](docs/guides/ODOO-SAAS-LIMITATIONS.md)
- Documentation index: [docs/guides/INDEX.md](docs/guides/INDEX.md)
- Local skill packs for specialized tasks: [.agents/skills/](.agents/skills/)

## 11) Studio App Features Roadmap

A comprehensive feature package system has been designed for Studio apps, enabling rapid capability expansion without custom code.

### MVP Features (Priority 1)

**Smart Field Validation (FEAT-VAL-001)** — 3-4 days  
- Email, phone, CPF/CNPJ, currency, date range validators
- Server-side constraints + client-side onchange
- Spec: [docs/features/spec-FEAT-VAL-001.yaml](docs/features/spec-FEAT-VAL-001.yaml)

**Audit Trail & History (FEAT-AUDIT-001)** — 4-5 days  
- Automatic change tracking (who, what, when, why)
- Full diff + read-only audit records
- Spec: [docs/features/spec-FEAT-AUDIT-001.yaml](docs/features/spec-FEAT-AUDIT-001.yaml)

**Workflow & Approvals (FEAT-APPROVE-001)** — 5-7 days  
- Multi-stage workflows, rules-based routing, auto-approve thresholds
- Rejection with edit capability, SLA tracking, full audit
- Spec: [docs/features/spec-FEAT-APPROVE-001.yaml](docs/features/spec-FEAT-APPROVE-001.yaml)

### Extended Features (Priority 2+)

7 additional features planned (bulk import, analytics, collaboration, webhooks, sharing, notifications, smart defaults).

**All features brainstormed**: [docs/plans/2026-04-27-studio-app-features-brainstorm.md](docs/plans/2026-04-27-studio-app-features-brainstorm.md)  
**Implementation roadmap**: [docs/plans/2026-04-27-roadmap-implementation.md](docs/plans/2026-04-27-roadmap-implementation.md)  
**Quick reference**: [docs/plans/QUICK_REFERENCE.md](docs/plans/QUICK_REFERENCE.md)

### Agent Responsibilities for Features

When implementing a feature:
1. **Read the spec** — Full YAML in `docs/features/spec-FEAT-*.yaml`
2. **Follow Phase 2** (Implement) — Step-by-step instructions
3. **Execute Validation Gates** (Phase 3) — All gates must pass
4. **Generate Evidence Report** (Phase 4) — Prove success with evidence

Each feature is designed for:
- **SaaS-safe**: API-only, no custom Python addons
- **Reusable**: 80%+ template across apps
- **Auditable**: Evidence-based completion gates
- **Deployable**: Integrate via deterministic tasks

### Feature Implementation Strategy

**Key principle**: Template-based reusability

1. Build core module once (validators.py, audit.py, workflow.py)
2. Create reusable task (add_field_validators.py, etc.)
3. Deploy to apps via template instantiation (< 5 minutes)
4. Run validation gates for each app
5. Generate evidence report

**Expected outcome**: 80%+ code reuse across apps

## 10) Agent Workflow Defaults

### Specialized Skills (`.agents/skills/`)
Always load relevant skills before starting work:
- **`odoo-19`** ← Use for ANY Odoo addon development (models, views, security, ORM, performance)
- **`codoo-methodology`** ← Use for deterministic FEAT execution and evidence-based completion checks
- **`brainstorming`** ← Use BEFORE creating features or components (explore intent, validate design)
- **`code-review`** ← Use before marking tasks complete (verify, prevent false claims)
- **`payment-integration`** ← For SePay, Polar, Stripe, Paddle integrations
- **`dtg-base`** ← For DTG Base model utilities (date/time, barcodes, timezone)
- **`ai-vibe-slides`** ← For presentation/slide deck generation
- **`writing-skills`** ← For creating/editing/verifying local skills
- **`postman-odoo`** ← For creating Postman collections, environments, and API gate evidence (Codoo Stage 4)

### Prompts & Subagents
Prefer structured prompts over ad-hoc planning:
- **`.github/prompts/codoo-init.prompt.md`** ← Initial diagnostics, environment validation (run first)
- **`.github/prompts/odoo-api-autopilot.prompt.md`** ← Automated API testing loop
- **`.github/prompts/codoo-dual-repo-commit.prompt.md`** ← Coordinated commit flow for root + `addon/` changes
- **`.github/agents/odoo-feature-executor.agent.md`** ← Full feature delivery (spec → PR)

### Core Principle: Link, Don't Duplicate
- Point to canonical docs ([CODOO.md](docs/guides/CODOO.md), [ARCHITECTURE.md](docs/guides/ARCHITECTURE.md), [CONTRIBUTING.md](docs/guides/CONTRIBUTING.md)) instead of copying
- Keep AGENTS.md as index, not encyclopedia
- Add project-specific conventions only here; detailed guidance lives in docs/
