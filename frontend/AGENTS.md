# AGENTS

Guidance for AI coding agents working in this frontend workspace.

## Scope

- Stack: React 19 + TypeScript + Vite SPA.
- Primary references:
  - [README.md](README.md)
  - [CONTRIBUTING.md](CONTRIBUTING.md)
  - [.github/instructions/catalog-contract-guard.instructions.md](.github/instructions/catalog-contract-guard.instructions.md)
  - [.github/instructions/supabase-playlist-schema.instructions.md](.github/instructions/supabase-playlist-schema.instructions.md)

## High-Value Commands

Run from `frontend/`:

```bash
corepack enable
pnpm install
pnpm dev
pnpm build
pnpm test:e2e
```

Fresh machine for E2E:

```bash
pnpm exec playwright install
```

## Architecture Boundaries

- Keep provider-specific data logic in `services/catalogSource.ts`.
- Keep UI components provider-agnostic and typed via `types.ts`.
- Use `loadCatalogData()` as the single catalog entrypoint.
- Preserve fallback to mock data when live providers fail.

## Data Source Modes

- `VITE_DATA_SOURCE=mock|supabase`.
- Supabase runtime model is public-only for catalog reads.
- Required in supabase mode: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`.
- Never expose service role keys in frontend code.

## Contract Invariants

- `Course.id` must remain stable and unique.
- `CurricularUnit.courseId` must match an existing `Course.id`.
- `Playlist.units` must remain `string[]` of valid unit ids.

## User Authentication (in progress)

Facodi uses **Supabase Auth** for user identity. The backend schema is already in place; frontend integration is the next phase.

Key facts:
- `public.profiles` is auto-created via `handle_new_user()` trigger on `auth.users` insert.
  - Fields: `id` (uuid = `auth.users.id`), `username`, `display_name`, `avatar_url`, `bio`, `avatar_path`, `role` (`'user'`|`'editor'`|`'admin'`), `submissions_count`.
- Related user tables (all RLS-enabled): `favorites`, `playlist_progress`, `user_follows`, `user_social_accounts`, `comments`, `notifications`.
- Use `@supabase/supabase-js` `supabase.auth.*` for session management (already installed via `services/catalogSource.ts`).
- Expose a shared singleton Supabase client from `services/supabase.ts` (create this file; do NOT re-create it inside components).
- For frontend auth, use `supabase.auth.onAuthStateChange` and React Context — do not store JWT in localStorage manually.
- Required env vars (already used): `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`.
- Migrations go via `mcp_supabase_apply_migration` — never edit production schema by hand.
- See [.github/instructions/auth-user.instructions.md](.github/instructions/auth-user.instructions.md) for full rules.

## Common Pitfalls

- Changing id formats breaks route navigation and playlist joins.
- Moving provider logic into UI components causes regressions.
- Forgetting deterministic playlist ordering causes UI flicker.
- Never create a second `SupabaseClient` instance — always import from `services/supabase.ts`.
- Do not read `auth.users` directly from frontend; use `public.profiles` via RLS.
- Role escalation is server-side only (`fix_role_escalation_trigger_use_auth_role` migration); never let frontend write `profiles.role`.

## Customization Files

- Agent reviewer for Supabase changes:
  - [.github/agents/supabase-integration-reviewer.agent.md](.github/agents/supabase-integration-reviewer.agent.md)
- File-scoped instructions:
  - [.github/instructions/catalog-contract-guard.instructions.md](.github/instructions/catalog-contract-guard.instructions.md)
  - [.github/instructions/supabase-playlist-schema.instructions.md](.github/instructions/supabase-playlist-schema.instructions.md)
  - [.github/instructions/auth-user.instructions.md](.github/instructions/auth-user.instructions.md)
