# AGENTS

Guidance for AI coding agents working in `frontend/`.

## 1) Scope

FACODI frontend is a React 19 + TypeScript + Vite SPA.

Authoritative docs:
- [frontend/README.md](README.md)
- [../docs/FACODI.md](../docs/FACODI.md)
- [../.github/instructions/odoo-elearning-frontend.instructions.md](../.github/instructions/odoo-elearning-frontend.instructions.md)
- [../.github/instructions/odoo-elearning.instructions.md](../.github/instructions/odoo-elearning.instructions.md)

## 2) Directory Landmarks

- `App.tsx` - app shell and routing
- `components/` - page-level UI components
- `services/catalogSource.ts` - single gateway for catalog data (mock/live Odoo)
- `data/` - local static fallback data and i18n dictionaries
- `types.ts` - shared domain models (`Course`, `CurricularUnit`, `Playlist`)
- `tests/e2e/` - Playwright smoke and route tests
- `playwright.config.ts` - local web server for E2E (`127.0.0.1:4173`)

## 3) Commands

Run from `frontend/`:

```bash
npm install
npm run dev
npm run build
npm run preview
npm run test:e2e
```

## 4) Data and Integration Rules

- Keep Odoo model details inside `services/catalogSource.ts`; do not leak raw Odoo fields into components.
- Components should consume only `types.ts` domain types.
- Preserve mock fallback behavior when Odoo path fails.
- Follow JSON-RPC and proxy guidance in `.github/instructions/odoo-elearning-frontend.instructions.md`.

## 5) Environment Notes

- `.env.local` is local-only and must never be committed.
- `VITE_DATA_SOURCE=odoo` enables live path; any other value keeps mock path.
- Live Odoo usage depends on valid proxy/CORS configuration.

## 6) Common Pitfalls

- Breaking `Course.id` <-> `CurricularUnit.courseId` mapping causes catalog joins to fail.
- Odoo relational fields may return `false`; always guard during mapping.
- Enabling live mode without proper JSON-RPC shape leads to silent fallback to mock.

## 7) When Updating Agent Customizations

- Update [../AGENTS.md](../AGENTS.md) for repository-wide rules.
- Update this file for frontend-only rules.
- Use `../.github/instructions/*.instructions.md` for file-scoped enforcement.
