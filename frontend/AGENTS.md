# AGENTS

Guidance for AI coding agents working in `frontend/`.

## 1) Product Identity and Scope

FACODI frontend is a React 19 + TypeScript + Vite SPA for open and community-driven higher education.

Primary references:
- [README.md](README.md)
- [../docs/FACODI.md](../docs/FACODI.md)
- [../AGENTS.md](../AGENTS.md)
- [../.github/instructions/odoo-elearning-frontend.instructions.md](../.github/instructions/odoo-elearning-frontend.instructions.md)
- [../.github/instructions/odoo-elearning.instructions.md](../.github/instructions/odoo-elearning.instructions.md)

## 2) Architecture and Code Organization

- `App.tsx`: app shell, route-state sync, data bootstrap.
- `components/`: view-level React components only.
- `services/catalogSource.ts`: single gateway for catalog data (mock and Odoo live).
- `data/`: static fallback catalog and i18n dictionaries.
- `types.ts`: stable domain contract (`Course`, `CurricularUnit`, `Playlist`).
- `tests/e2e/`: Playwright route and lesson navigation checks.
- `playwright.config.ts`: E2E local server bootstrap at `127.0.0.1:4173`.

## 3) Development Environment (Required)

Run from `frontend/`.

```bash
corepack enable
pnpm install
pnpm dev
pnpm build
pnpm preview
pnpm test:e2e
```

Notes:
- `packageManager` is pinned in `package.json`; use `pnpm`, not `npm`, for consistency.
- Never run package manager commands with `sudo`.
- If `pnpm` mismatch happens, run `corepack prepare pnpm@10.17.1 --activate`.

## 4) Environment Configuration

- Use `.env.local` for local secrets and machine-specific values.
- Never commit `.env`, `.env.local`, or any secret keys.
- Copy from `.env.local.example` when starting setup.

Expected frontend variables:
- `VITE_DATA_SOURCE`: `mock` (default) or `odoo`.
- `VITE_BACKEND_URL`: backend/proxy URL for production Odoo path.
- `VITE_ODOO_DB`, `VITE_ODOO_USERNAME`, `VITE_ODOO_PASSWORD`: Odoo auth for live sync.
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`: Supabase client config.

## 5) Integration and Boundary Rules

- Keep Odoo model details inside `services/catalogSource.ts`.
- Components must consume only `types.ts` domain types.
- Preserve mock fallback behavior whenever live integration fails.
- Follow JSON-RPC and proxy guidance in frontend Odoo instruction files.
- Keep database-specific logic out of UI components.

## 6) Common Pitfalls

- Breaking `Course.id` and `CurricularUnit.courseId` mapping breaks joins across pages.
- Odoo relational fields may return `false`; always guard and coerce safely.
- `VITE_DATA_SOURCE` must be exactly `odoo` for live mode.
- Using non-`VITE_` keys in frontend env files causes values to be unavailable at runtime.

## 7) When Updating Agent Customizations

- Update [../AGENTS.md](../AGENTS.md) for repository-wide behavior.
- Keep this file focused on frontend specifics.
- Use `../.github/instructions/*.instructions.md` for file-scoped enforcement.

## 8) Supabase MCP Migration Workflow (`mcp_supabase_apply_migration`)

Use this workflow whenever a task involves database schema changes through Supabase MCP:

1. Understand current schema first:
	- Call `mcp_supabase_list_tables` (at least `public`) before proposing DDL.
	- If needed, call `mcp_supabase_list_extensions` to confirm extension dependencies.
2. Validate approach against docs before changing schema:
	- Query `mcp_supabase_search_docs` for the specific feature or SQL pattern.
3. Apply DDL only with `mcp_supabase_apply_migration`:
	- Use a descriptive snake_case migration name.
	- Keep migrations idempotent/safe when practical.
	- Never hardcode generated IDs inside data migrations.
4. Post-change verification is mandatory:
	- Run `mcp_supabase_get_advisors` with `security` and `performance`.
	- Re-check with `mcp_supabase_list_tables` to verify expected structure.
	- Use `mcp_supabase_get_logs` (`postgres` and relevant services) when failures occur.
5. Frontend integration follow-up:
	- Regenerate and use updated types when schema changes affect app data contracts.
	- Keep database-specific logic out of UI components; map data through service boundaries.
