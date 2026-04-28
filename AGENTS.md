# AGENTS

Guidance for AI coding agents working in this repository.

## Scope

- This repository is currently centered on the public web app in `frontend/` plus shared documentation in `docs/`.
- Treat filesystem reality as source of truth. Do not assume historical folders like `backend/` or `workspace/` exist unless they are present.
- Keep changes small, focused, and safe. Avoid broad refactors unless explicitly requested.

## First Read

- Root overview: [README.md](README.md)
- Architecture notes: [docs/ARQUITETURA_MONOREPO_ODOO.md](docs/ARQUITETURA_MONOREPO_ODOO.md)
- Product/institution context: [docs/FACODI.md](docs/FACODI.md)
- Frontend usage: [frontend/README.md](frontend/README.md)

## Practical Map (Current)

- `frontend/`: React + Vite application and E2E tests.
- `frontend/components/`: page-level and shared UI components.
- `frontend/data/`: mock/course catalog data and i18n data.
- `frontend/services/`: data source abstraction (mock vs Odoo-driven).
- `frontend/tests/e2e/`: Playwright route-level tests.
- `docs/`: architecture and project documentation.
- `requirements.txt`: Python dependencies used by auxiliary scripts/workflows.

## Commands Agents Should Prefer

Run from `frontend/`:

- Install: `npm install`
- Dev server: `npm run dev`
- Build: `npm run build`
- Preview build: `npm run preview`
- E2E tests: `npm run test:e2e`

Python tooling (repo root):

- Virtual environment (PowerShell): `python -m venv .venv ; .\.venv\Scripts\Activate.ps1`
- Install Python deps: `pip install -r requirements.txt`

## Conventions

- Preserve existing TypeScript/React style in `frontend/`; avoid unnecessary renames or structural moves.
- For documentation updates, prefer correcting stale paths/assumptions over rewriting entire docs.
- Link to existing docs instead of duplicating large sections.
- If a requested path is missing, explicitly state it and propose/create the minimal valid alternative.

## Known Pitfalls

- Some docs still reference historical monorepo folders that may not exist in this checkout.
- Do not run commands in non-existent directories; verify paths first.
- Playwright is configured under `frontend/` and uses its own web server settings.

## When Updating Customizations

- Update this file (`AGENTS.md`) for always-on repository-wide guidance.
- Use `.github/agents/*.agent.md` for specialized subagent behavior.
- Keep instructions concise and behavior-oriented; avoid repeating content already documented elsewhere.
