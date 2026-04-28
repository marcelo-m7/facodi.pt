# AGENTS.md

Agent onboarding for FACODI. Keep this file concise and link to canonical docs.

## 1) Repository Mission

This repository combines:
- Codoo orchestration and task runtime in Python (`src/codoo/`)
- FACODI frontend application in React/Vite (`frontend/`)
- Methodology, guides, and evidence in `docs/`

Primary references:
- [README.md](README.md)
- [docs/guides/CODOO.md](docs/guides/CODOO.md)
- [docs/guides/ARCHITECTURE.md](docs/guides/ARCHITECTURE.md)
- [docs/guides/CONTRIBUTING.md](docs/guides/CONTRIBUTING.md)
- [docs/guides/INDEX.md](docs/guides/INDEX.md)
- [docs/FACODI.md](docs/FACODI.md)

## 2) Critical Boundaries

- This is a single repository workflow. Do not assume an `addon/` submodule or dual-repo commit flow.
- Treat these trees as read-only mirrors unless explicitly requested:
  - `docs/odoo/**`
  - `docs/documentation/**`
- Never commit `.env` or `.env.local` secrets.

## 3) Project Map

- `src/codoo/` - Python package (CLI, task system, Odoo client, core runtime)
- `tests/` - Python unit and integration tests
- `frontend/` - FACODI SPA (React + Vite + Playwright)
- `features/` - FEAT specs and feature artifacts
- `docs/guides/` - methodology, architecture, contribution, setup, security
- `docs/logs/` - execution evidence JSON logs
- `.github/instructions/` - file-scoped coding rules
- `.github/prompts/` - reusable prompts
- `.github/agents/` - specialized subagents

## 4) Fast Start

Python (root):

```powershell
python -m venv .venv
& .venv\Scripts\Activate.ps1
pip install -e .
python -m codoo --help
python -m codoo task list
```

```bash
python -m venv .venv
source .venv/bin/activate
pip install -e .
python -m codoo --help
python -m codoo task list
```

Frontend:

```bash
cd frontend
npm install
npm run dev
npm run build
npm run test:e2e
```

## 5) Task and Validation Defaults

- For mutable Codoo tasks, preserve deterministic mode order:
  1. `inspect`
  2. `dry-run`
  3. `apply`
  4. `verify`
- Write run evidence to `docs/logs/<task>_<mode>_<timestamp>.json`.
- For feature execution, use specs from `features/spec-FEAT-*.yaml` as source of truth.
- Follow Codoo validation gates and reporting rules in [docs/guides/CODOO.md](docs/guides/CODOO.md).

## 6) Frontend/Odoo Integration Rules

When touching frontend Odoo catalog integration, follow these instructions first:
- [.github/instructions/odoo-elearning-frontend.instructions.md](.github/instructions/odoo-elearning-frontend.instructions.md)
- [.github/instructions/odoo-elearning.instructions.md](.github/instructions/odoo-elearning.instructions.md)

Key constraints:
- Odoo calls are centralized in `frontend/services/catalogSource.ts`.
- `VITE_DATA_SOURCE` must be exactly `odoo` to activate live path.
- Odoo SaaS requires JSON-RPC patterns and proxy/CORS-safe routing.

## 7) Agent Customization Map

- Base onboarding: [AGENTS.md](AGENTS.md)
- Frontend-specific onboarding: [frontend/AGENTS.md](frontend/AGENTS.md)
- File-scoped rules: [.github/instructions/](.github/instructions/)
- Reusable prompts: [.github/prompts/](.github/prompts/)
- Specialized subagent: [.github/agents/odoo-feature-executor.agent.md](.github/agents/odoo-feature-executor.agent.md)
- Local skills: [.agents/skills/](.agents/skills/)

## 8) Known Pitfalls

- XML-RPC endpoints can return 405 on GET; validate connectivity with authenticate calls.
- Odoo SaaS may block parts of custom module flows; document evidence and fallback decisions.
- After large Python edits, run `python -m py_compile <file>` before broader validation.
- During UI checks, inspect browser console for JS errors before declaring success.
