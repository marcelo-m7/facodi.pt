---
applyTo: "services/catalogSource.ts,types.ts,data/**"
description: "Rules for editing Odoo e-learning integration code: catalogSource.ts, types, and data mapping."
---

# Odoo E-learning Integration Rules

## Single Gateway Principle
- All Odoo data access MUST go through `services/catalogSource.ts`.
- Never import Odoo field names, model names, or raw API responses in components.
- Components consume `Course`, `CurricularUnit`, and `Playlist` from `types.ts` only.

## Model Mapping
| Odoo model | Frontend type | Mapping function |
|---|---|---|
| `slide.channel` | `Course` | `mapChannelToCourse()` |
| `slide.slide` | `CurricularUnit` | `mapSlideToUnit()` |

- New Odoo fields → update the relevant `map*` function, nowhere else.
- Always call `stripHtml()` on any Odoo field that may contain HTML before assigning to a TypeScript type.
- Always guard against `false` (Odoo returns `false` for empty relational fields, not `null`).

## API Call Pattern
```ts
// Always use postSearchRead() — never fetch Odoo directly from components
const result = await postSearchRead('slide.channel', {
  domain: [...],   // Odoo domain tuples
  fields: [...],   // Enumerate fields explicitly — no wildcard
  limit: 200,
  offset: 0,
});
```

## Odoo Domain Syntax
- Domains are arrays of `[field, operator, value]` tuples, combined with `'&'` (default), `'|'`, `'!'`.
- Example: `[['enroll', '=', 'public'], ['website_published', '=', true]]`
- Always use `'in'` for multi-value filters on IDs: `[['channel_id', 'in', channelIds]]`

## Falsy Field Guards
Odoo returns `false` (boolean) for empty relational fields, not `null` or `undefined`. Always guard:
```ts
const channelTuple = Array.isArray(record.channel_id) ? record.channel_id : [];
const name = String(record.name || '').trim();
const id = Number(record.id);  // 0 is falsy — check if (!id) to detect missing
```

## Course ID Normalization
- `normalizeCourseId()` maps Odoo channel IDs to stable string IDs used throughout the SPA.
- Add new mappings inside `normalizeCourseId()` — do NOT hardcode channel IDs elsewhere.
- `Course.id` ↔ `CurricularUnit.courseId` is the join key across the entire app. Never change type of either.

## Error Handling
- `loadCatalogData()` wraps Odoo calls in try/catch and falls back to mock on any error.
- Do not swallow errors silently — always `console.warn` with the error before returning mock.
- Partial failures (channels succeed, slides fail) should still fall back to mock for consistency.

## Extending Fields
When adding new Odoo fields to existing types (e.g., adding `website_url` to `Course`):
1. Add the field name to the `fields: [...]` array in the `postSearchRead` call.
2. Update the `map*` function to read and map the new field.
3. Update the TypeScript type in `types.ts` (optional fields use `field?: type`).
4. Do NOT modify component files — data shaping belongs in `catalogSource.ts`.

## Environment
- Live Odoo path activates only when `VITE_DATA_SOURCE === 'odoo'` (exact lowercase string).
- `VITE_BACKEND_URL` must point to the proxy (`https://edu-facodi.odoo.com`), not the Odoo XML-RPC endpoint directly.
- Always test mock path works with `VITE_DATA_SOURCE=mock` before enabling live path.
