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
- `services/catalogSource.ts`: single gateway for catalog data (mock, Odoo, Supabase public).
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
- On fresh environments, run `pnpm exec playwright install` before `pnpm test:e2e`.

## 4) Environment Configuration

- Use `.env.local` for local secrets and machine-specific values.
- Never commit `.env`, `.env.local`, or any secret keys.
- Copy from `.env.local.example` when starting setup.

Expected frontend variables:
- `VITE_DATA_SOURCE`: `mock` (default), `odoo`, or `supabase`.
- `VITE_BACKEND_URL`: backend/proxy URL for production Odoo path.
- `VITE_ODOO_DB`, `VITE_ODOO_USERNAME`, `VITE_ODOO_PASSWORD`: Odoo auth for live sync.
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`: Supabase client config.

## 5) Integration and Boundary Rules

- Keep Odoo model details inside `services/catalogSource.ts`.
- Keep Supabase table/query details inside `services/catalogSource.ts`.
- Components must consume only `types.ts` domain types.
- Preserve mock fallback behavior whenever live integration fails.
- Follow JSON-RPC and proxy guidance in frontend Odoo instruction files.
- Keep database-specific logic out of UI components.

## 6) Common Pitfalls

- Breaking `Course.id` and `CurricularUnit.courseId` mapping breaks joins across pages.
- Odoo relational fields may return `false`; always guard and coerce safely.
- `VITE_DATA_SOURCE` must be exactly `odoo` for live mode.
- Using non-`VITE_` keys in frontend env files causes values to be unavailable at runtime.
- `Playlist.units` stores `CurricularUnit.id` values; changing unit ID format without migration breaks playlist pages.

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

## 9) Supabase Frontend Integration Kickoff

Use this checklist when updating `VITE_DATA_SOURCE=supabase` in `services/catalogSource.ts`.

1. Data source contract:
- Keep `loadCatalogData()` as the single public entrypoint.
- Preserve graceful fallback to mock (`source: 'mock'`) on Supabase errors.
2. Environment guards:
	- Require `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` only in Supabase mode.
	- Never use service role keys in frontend code or frontend `.env` files.
3. Service boundary:
	- Convert Supabase rows to `Course`, `CurricularUnit`, and `Playlist` inside `services/catalogSource.ts`.
	- Do not pass raw Supabase row shapes into React components.
4. Error visibility:
	- Log Supabase failures with a distinct prefix (for example `[catalogSource:supabase]`).
	- Keep fallback behavior, but avoid fully silent failures during development.
5. Validation:
	- Run `pnpm build` and `pnpm test:e2e` after adding Supabase source paths.

## 10) Playlist Schema Contract (For Supabase)

Current frontend expectations from `types.ts` and app views:

- `Playlist.id`: stable text identifier.
- `Playlist.title`: user-facing label.
- `Playlist.description`: optional narrative (empty string accepted).
- `Playlist.units`: array of `CurricularUnit.id` (string) used by playlist navigation.
- `Playlist.estimatedHours`: numeric value (currently `0` is acceptable).
- `Playlist.creator`: source/curation label.

Current production model in Supabase public schema:

- `courses` (catalog metadata, `code` used as stable external course id).
- `units` (curricular units with `code`, `course_id`, and enriched fields).
- `playlists` (public playlists with `course_code` + `unit_code` mapping to frontend route ids).
- `unit_enrichments`, `learning_outcomes`, `resources` (enrichment layers).

Mapping rule in `services/catalogSource.ts`:

- Build `Playlist.units` from `playlists.unit_code` where unit exists in loaded `units`.
- Keep deterministic ordering by `course_code` then `unit_code` in Supabase queries.

## 11) Supabase Security Baseline For Agents

- If public frontend reads are required, enable RLS and create explicit read policies for `anon`/`authenticated` as needed.
- Do not rely on user-editable metadata (`user_metadata`) for authorization decisions.
- Re-run `mcp_supabase_get_advisors` (`security` and `performance`) after schema/policy updates.

## 12) Added Agent Customizations

These workspace customizations support the Supabase integration rollout:

- `./.github/instructions/supabase-playlist-schema.instructions.md`: file-scoped rules for Supabase integration boundaries and playlist mapping.
- `./.github/instructions/catalog-contract-guard.instructions.md`: guardrails to prevent regressions in Course/Unit/Playlist contracts.
- `./.github/skills/supabase-sync-check/SKILL.md`: repeatable preflight/post-change checklist for Supabase schema and frontend contract readiness.
- `./.github/agents/supabase-integration-reviewer.agent.md`: focused reviewer persona for Supabase integration PRs.
