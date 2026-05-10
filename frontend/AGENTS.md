# AGENTS

Guidance for AI coding agents working in this frontend workspace.

## Quick Start

- Stack: React 19 + TypeScript + Vite SPA.
- Package manager: pnpm (`packageManager` is pinned in [package.json](package.json)).
- Start from workspace root `frontend/`.

Core commands:

```bash
corepack enable
pnpm install
pnpm dev
pnpm build
pnpm test:e2e
```

Fast verification profiles:

```bash
# quick safety check for scoped code edits
pnpm test:unit

# full regression check for route/view-state updates
pnpm build && pnpm test:e2e
```

Optional security command (only if script exists in your branch):

```bash
pnpm security:check-rls
```

On fresh machines for E2E:

```bash
pnpm exec playwright install
```

## Source Of Truth

- Project overview and runtime modes: [README.md](README.md)
- Contribution/PR expectations: [CONTRIBUTING.md](CONTRIBUTING.md)
- Catalog contract rules: [.github/instructions/catalog-contract-guard.instructions.md](.github/instructions/catalog-contract-guard.instructions.md)
- Supabase catalog mapping rules: [.github/instructions/supabase-playlist-schema.instructions.md](.github/instructions/supabase-playlist-schema.instructions.md)
- Auth/user feature rules: [.github/instructions/auth-user.instructions.md](.github/instructions/auth-user.instructions.md)

When touching files covered by instruction `applyTo`, follow those instruction files as authoritative.

## Architecture Guardrails

- Keep provider-specific data logic in [services/catalogSource.ts](services/catalogSource.ts).
- Keep UI components provider-agnostic and typed via [types.ts](types.ts).
- Use `loadCatalogData()` as the single catalog entrypoint.
- Preserve mock fallback when live providers fail.

## Runtime And Data-Source Rules

- `VITE_DATA_SOURCE=mock|supabase` controls runtime source selection.
- Keep fallback behavior: if Supabase catalog fetch fails, return mock data.
- Keep source-specific error logs explicit (for example `[catalogSource:supabase]`).

## E2E Testing Notes

- E2E tests live in [tests/e2e/](tests/e2e/).
- Install browsers on fresh machines with `pnpm exec playwright install`.
- Keep catalog ordering deterministic to avoid flaky navigation/UI assertions.
- Prefer running `pnpm test:e2e` after route, navigation, or view-state changes.

## Agent Tooling Playbooks

- Use prompt `.github/prompts/frontend-dev-workflow.prompt.md` to standardize branch-ready validation and output summaries.
- Use agent `.github/agents/frontend-quality-reviewer.agent.md` for broad frontend review (routing, accessibility, regressions, missing tests).
- Use agent `.github/agents/supabase-integration-reviewer.agent.md` when touching Supabase catalog/auth mapping or public schema assumptions.
- Prefer subagent `Explore` for read-only mapping of large areas before edits to reduce context drift.

Suggested execution profiles:

- UI-only page/component edits: `pnpm build`
- Data mapping or auth logic edits: `pnpm test:unit && pnpm build`
- Navigation or route-flow edits: `pnpm build && pnpm test:e2e`
- Supabase schema-sensitive edits: `pnpm security:check-rls && pnpm build`

## Critical Data Contracts

- `Course.id` stays stable and unique.
- `CurricularUnit.courseId` must reference an existing `Course.id`.
- `Playlist.units` remains `string[]` of valid unit ids.
- Maintain deterministic playlist ordering to avoid UI flicker/regressions.

## Supabase Safety Rules

- Frontend catalog reads use public schema only.
- Never expose service-role or other secret keys in frontend code.
- Use a single shared client from [services/supabase.ts](services/supabase.ts); do not create additional client instances.
- Never query `auth.users` from frontend code; use `public.profiles` access patterns defined in auth instructions.

## Common Failure Modes

- ID format changes break routing and joins.
- Provider logic leaking into components causes coupling and regressions.
- Parallel data entrypoints drift; keep integration centralized.
- Non-deterministic unit/playlist ordering causes UI flicker and test instability.
- Running `pnpm security:check-rls` fails when the backing script is absent.

## Specialized Reviewer

For Supabase integration changes, use:

- [.github/agents/supabase-integration-reviewer.agent.md](.github/agents/supabase-integration-reviewer.agent.md)

For general frontend quality/regression reviews, use:

- [.github/agents/frontend-quality-reviewer.agent.md](.github/agents/frontend-quality-reviewer.agent.md)
