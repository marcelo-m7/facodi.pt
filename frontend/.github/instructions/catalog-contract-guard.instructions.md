---
description: "Use when changing catalog models, playlist mapping, or data-source integration in services/catalogSource.ts and types.ts to prevent contract regressions."
applyTo: "{services/catalogSource.ts,types.ts,data/playlists.ts,App.tsx,components/**/*.tsx}"
---

# Catalog Contract Guardrails

## Non-negotiable Contracts

- Keep `Course.id` stable and unique across all sources.
- Keep `CurricularUnit.courseId` mapped to an existing `Course.id`.
- Keep `Playlist.units` as `string[]` of existing `CurricularUnit.id` values.

## Change Discipline

- Do not rename `Course.id`, `CurricularUnit.id`, `CurricularUnit.courseId`, or `Playlist.units` without a migration and compatibility plan.
- If adding new optional fields, keep existing consumers working without code changes.
- Preserve deterministic ordering when building playlist unit arrays.

## Service Boundary Rules

- Keep provider-specific fetch and mapping logic in `services/catalogSource.ts`.
- Keep components and `App.tsx` free of provider-specific table names, SQL, or transport details.

## Runtime Behavior Rules

- Preserve mock fallback behavior when live source loading fails.
- Log source-specific failures with explicit prefixes to aid debugging.

## Verification Checklist

- Confirm route views still resolve units by id.
- Confirm playlist screens still navigate correctly from playlist units to lesson/unit views.
- Confirm source switch (`mock`, `supabase`) does not break payload shape returned by `loadCatalogData()`.
