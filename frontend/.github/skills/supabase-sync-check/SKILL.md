---
name: supabase-sync-check
description: "Run a repeatable Supabase integration readiness checklist for frontend catalog sync. Use for schema validation, playlist mapping checks, RLS/policy sanity checks, and post-change verification before wiring services/catalogSource.ts."
argument-hint: "Describe scope: schema-only, integration-only, or full preflight"
---

# Supabase Sync Check

Use this skill to validate Supabase readiness before or after frontend integration changes.

## When To Use

- You are starting or reviewing `VITE_DATA_SOURCE=supabase` work.
- Schema changes may affect `Course`, `CurricularUnit`, or `Playlist` mapping.
- You need a stable checklist for RLS, playlist joins, and fallback behavior.

## Procedure

1. Confirm current schema baseline with `mcp_supabase_list_tables` (`public` at minimum).
2. Validate approach with `mcp_supabase_search_docs` for the exact SQL/policy pattern.
3. If DDL is needed, use `mcp_supabase_apply_migration` with a descriptive snake_case name.
4. Run post-change checks with:
- `mcp_supabase_get_advisors` type `security`
- `mcp_supabase_get_advisors` type `performance`
- `mcp_supabase_list_tables` again to confirm final shape
5. Validate frontend contract mapping in `services/catalogSource.ts`:
- `Course.id` <-> `CurricularUnit.courseId`
- `Playlist.units` contains `CurricularUnit.id` values
- Playlist ordering is deterministic
6. Validate runtime behavior:
- Missing/invalid Supabase config does not crash app
- Graceful fallback to mock remains intact

## Expected Output

Provide a short report with:

- Schema status (ok or issues)
- Security/performance advisor findings (highlights only)
- Contract mapping status (ok or breaks)
- Required actions in priority order

## Guardrails

- Never put service role keys in frontend env files.
- Do not move database-specific logic into React components.
- If a schema change alters existing IDs or joins, require a migration plan before merge.
