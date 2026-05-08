---
applyTo: "{services/catalogSource.ts,types.ts,data/playlists.ts,.env.local.example}"
---

# Supabase Catalog Integration Rules

Use this instruction when implementing or reviewing Supabase integration for catalog and playlists.

## Scope and Boundaries

- Keep provider-specific logic (Odoo/Supabase) in `services/catalogSource.ts`.
- Keep UI components provider-agnostic; they must only consume domain types from `types.ts`.
- Do not move SQL/table names into components.
- For FACODI catalog, use only schema `public`.

## Data Contract Preservation

- Preserve `Course.id` to `CurricularUnit.courseId` joins.
- Preserve `Playlist.units` as an array of `CurricularUnit.id` strings expected by UI routes.
- If adding fields, make them optional in `types.ts` unless all providers can supply them.

## Supabase Source Rules

- Add Supabase as a source path in `loadCatalogData()` instead of creating parallel entrypoints.
- Validate required env keys (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`) only when Supabase mode is selected.
- Never use service role or secret keys in frontend code or frontend env examples.
- Prefer querying `public.courses`, `public.units`, and `public.playlists` for runtime catalog payloads.

## Fallback and Errors

- Keep graceful fallback to mock data when live fetch fails.
- Log source-specific failures with clear prefixes (for example `[catalogSource:supabase]`).

## Playlist Modeling Expectation

- Current production mapping uses `public.playlists.unit_code` to build `Playlist.units`.
- Filter out playlists that reference unknown units.
- Preserve deterministic ordering by `course_code` and `unit_code` in Supabase query order.
