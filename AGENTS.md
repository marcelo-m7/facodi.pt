# AGENTS

Guidance for AI coding agents working in this frontend workspace.

## Quick Start

- Stack: React 19 + TypeScript + Vite SPA.
- Package manager: pnpm (`packageManager` is pinned in [package.json](package.json)).
- Start from repository root (`facodi/`).

Core commands:

```bash
corepack enable
pnpm install
pnpm dev
pnpm build
pnpm test:e2e
pnpm security:check-rls
```

On fresh machines for E2E:

```bash
pnpm exec playwright install
```

## Source Of Truth

- Project overview and runtime modes: [README.md](README.md)
- Contribution/PR expectations: [CONTRIBUTING.md](CONTRIBUTING.md)
- Docs map for quick navigation: [README.md#documentacao](README.md#documentacao)
- **Supabase architecture & audit**: [SUPABASE_AUDIT_REPORT.md](SUPABASE_AUDIT_REPORT.md)
- Postman MCP rules: [.github/instructions/postman-mcp.instructions.md](.github/instructions/postman-mcp.instructions.md)

**DEPRECATED INSTRUCTIONS** (archived for reference only, not active):
- [.github/instructions/odoo-elearning-frontend.instructions.md](.github/instructions/odoo-elearning-frontend.instructions.md) — **Odoo integration NOT implemented** (2026-05-13)
- [.github/instructions/odoo-elearning.instructions.md](.github/instructions/odoo-elearning.instructions.md) — **Odoo integration NOT implemented** (2026-05-13)

When touching files covered by instruction `applyTo`, follow those instruction files as authoritative.

## Architecture Guardrails

- Keep provider-specific data logic in [services/catalogSource.ts](services/catalogSource.ts).
- Keep UI components provider-agnostic and typed via [types.ts](types.ts).
- Use `loadCatalogData()` as the single catalog entrypoint.
- Preserve mock fallback when live providers fail.

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

## Specialized Reviewer

For Supabase integration changes, use:

- Default reviewer workflow from skill: [.agents/skills/code-review/SKILL.md](.agents/skills/code-review/SKILL.md)
