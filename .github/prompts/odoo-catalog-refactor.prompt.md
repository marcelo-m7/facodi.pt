---
mode: agent
description: "Refactor catalogSource.ts to consume the Odoo Facodi e-learning API. Use when: connecting to Odoo, updating catalog source, mapping Odoo fields, enabling live data, odoo facodi api, e-learning refactor."
tools: [read_file, replace_string_in_file, get_errors, run_in_terminal]
---

# Odoo Facodi Catalog Refactor

Refactor `services/catalogSource.ts` to correctly consume the Odoo Facodi e-learning API instance.

**Target instance:** `https://edu-facodi.odoo.com`  
**Odoo models:** `slide.channel` (courses) → `slide.slide` (units)

## Step 1 — Validate environment

Check `.env.local` has the correct values:
```
VITE_DATA_SOURCE=odoo
VITE_BACKEND_URL=https://edu-facodi.odoo.com
```

If not present, add them. Never commit `.env.local`.

## Step 2 — Verify proxy connectivity

Run a quick smoke test to confirm the backend proxy is reachable and returns channel records:
```sh
curl -s -X POST "https://edu-facodi.odoo.com/models/slide.channel/search_read" \
  -H "Content-Type: application/json" \
  -d '{"domain":[],"fields":["id","name"],"limit":5}' | head -c 500
```

If this fails, check CORS headers and proxy availability before proceeding.

## Step 3 — Audit current `mapChannelToCourse()` and `mapSlideToUnit()`

Read `services/catalogSource.ts` fully. For each map function, verify:
- All desired Odoo fields are included in the `fields: [...]` array of the `postSearchRead` call.
- The TypeScript `Course` and `CurricularUnit` interfaces in `types.ts` align with what Odoo returns.
- HTML stripping (`stripHtml()`) is applied to description fields.
- Falsy guard applied to all relational fields (Odoo returns `false`, not `null`).

## Step 4 — Extend field coverage if needed

Common fields to consider adding per model:

**`slide.channel` → `Course`:**
- `website_url` — public URL to the channel
- `enroll_msg` — enrollment message
- `members_count` — number of enrolled learners
- `category_ids` — channel categories

**`slide.slide` → `CurricularUnit`:**
- `url` — direct URL to slide
- `datas` (binary) — avoid downloading this
- `website_published` — visibility flag
- `nbr_document`, `nbr_video`, `nbr_infographic` — content type counts

## Step 5 — Update `types.ts` if new fields are added

- Add optional fields (`field?: type`) to avoid breaking existing mock data.
- Do NOT rename or remove existing fields — components depend on them.

## Step 6 — Test live data load

```sh
npm run dev
```

Open the app and verify:
1. The source badge in the UI shows `odoo` (not `mock`).
2. Courses list populates from Odoo channels.
3. Course units/slides display correctly under each course.
4. Browser console (F12) shows no fetch errors.

## Step 7 — Revert to mock and confirm fallback still works

Set `VITE_DATA_SOURCE=mock` in `.env.local`, restart dev server, confirm mock data still renders.

## Completion Criteria

- [ ] `.env.local` configured for Odoo
- [ ] Proxy returns `slide.channel` and `slide.slide` records
- [ ] `mapChannelToCourse()` maps all relevant fields
- [ ] `mapSlideToUnit()` maps all relevant fields
- [ ] UI shows live Odoo data with `odoo` source badge
- [ ] No browser console errors
- [ ] Mock fallback still works
