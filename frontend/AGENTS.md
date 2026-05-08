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

- `VITE_DATA_SOURCE=mock|odoo|supabase`.
- Supabase runtime model is public-only for catalog reads.
- Required in supabase mode: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`.
- Never expose service role keys in frontend code.

## Contract Invariants

- `Course.id` must remain stable and unique.
- `CurricularUnit.courseId` must match an existing `Course.id`.
- `Playlist.units` must remain `string[]` of valid unit ids.

## Common Pitfalls

- Changing id formats breaks route navigation and playlist joins.
- Moving provider logic into UI components causes regressions.
- Forgetting deterministic playlist ordering causes UI flicker.

## Customization Files

- Agent reviewer for Supabase changes:
  - [.github/agents/supabase-integration-reviewer.agent.md](.github/agents/supabase-integration-reviewer.agent.md)
- File-scoped instructions:
  - [.github/instructions/catalog-contract-guard.instructions.md](.github/instructions/catalog-contract-guard.instructions.md)
  - [.github/instructions/supabase-playlist-schema.instructions.md](.github/instructions/supabase-playlist-schema.instructions.md)
