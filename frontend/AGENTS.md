# AGENTS

Guidance for AI coding agents working in this repository.

## Project Overview

**FACODI** — React 19 + Vite SPA serving a Portuguese e-learning course catalog. Backed by Odoo e-learning (`edu-facodi.odoo.com`) via a REST proxy, with mock static data as fallback.

## Directory Map

| Path | Purpose |
|---|---|
| `services/catalogSource.ts` | **Single gateway** to all catalog data — mock or Odoo live |
| `types.ts` | Domain types: `Course`, `CurricularUnit`, `Playlist`, enums |
| `data/courses.ts` | Static mock `CurricularUnit[]` (fallback) |
| `data/degrees.ts` | Static mock `Course[]` (fallback) |
| `data/i18n.ts` | `pt`/`en` translation strings via `createTranslator(locale)` |
| `components/` | Page-level React components, one file per route |
| `tests/e2e/routes.spec.ts` | Playwright route smoke tests |

## Commands

Run from the `frontend/` directory:

```sh
npm install          # Install deps
npm run dev          # Dev server on port 3000
npm run build        # Production build
npm run preview      # Preview production build
npm run test:e2e     # Playwright E2E tests
```

## Odoo Integration — Architecture

**Target instance:** `https://edu-facodi.odoo.com`

**Pattern:** Frontend → REST proxy at `VITE_BACKEND_URL` → Odoo XML-RPC internally.
- The frontend does NOT call Odoo XML-RPC directly.
- All Odoo calls are `POST /models/{model}/search_read` via `postSearchRead()` in `catalogSource.ts`.

**Odoo e-learning model mapping:**

| Odoo model | Frontend type | Key fields used |
|---|---|---|
| `slide.channel` | `Course` | `id`, `name`, `description`, `enroll`, `total_slides`, `total_time` |
| `slide.slide` | `CurricularUnit` | `id`, `name`, `description`, `channel_id`, `sequence`, `completion_time`, `tag_ids`, `is_preview`, `slide_category` |

**Course ID normalization** (`normalizeCourseId` in `catalogSource.ts`):
- Channel named with "engenharia" + "tecnologias da informação" → `LESTI`
- Channel named with "design de comunicação" → `LDCOM`
- Otherwise → `ODOO-{channelId}`

## Environment Variables

`.env.local` (never commit, copy from `.env.example` if missing):

| Variable | Values | Effect |
|---|---|---|
| `VITE_DATA_SOURCE` | `odoo` / anything else | `odoo` enables live Odoo path; all other values use mock |
| `VITE_BACKEND_URL` | e.g. `https://edu-facodi.odoo.com` | Base URL for the REST proxy |
| `VITE_SUPABASE_URL` | Supabase project URL | Planned integration (SDK not yet installed) |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon key | Planned integration |

**To enable live Odoo data locally:**
```
VITE_DATA_SOURCE=odoo
VITE_BACKEND_URL=https://edu-facodi.odoo.com
```

> Current default `.env.local` sets `VITE_DATA_SOURCE=edu-facodi` (not `'odoo'`), so mock data loads locally by default.

## Data Flow

```
App.tsx (mount)
  └─ loadCatalogData()            ← services/catalogSource.ts
       ├─ MOCK: returns DEGREES + COURSE_UNITS from data/
       └─ LIVE (VITE_DATA_SOURCE=odoo):
            ├─ POST /models/slide.channel/search_read  → Course[]
            ├─ POST /models/slide.slide/search_read    → CurricularUnit[]
            └─ On error → falls back to MOCK (console.warn)
```

## Conventions

- `catalogSource.ts` is the **only** file that talks to Odoo — keep all fetch logic there.
- When adding new Odoo fields, update `mapChannelToCourse()` or `mapSlideToUnit()` in `catalogSource.ts`.
- Do NOT add Odoo field references directly into components.
- Preserve existing TypeScript/React style; avoid unnecessary renames or structural moves.
- `Course.id` ↔ `CurricularUnit.courseId` is the join key — keep this relationship intact.

## Known Pitfalls

- `VITE_DATA_SOURCE` must be the exact string `'odoo'` (lowercase) to trigger the live path — any other value (including `'edu-facodi'`) uses mock.
- The Odoo proxy at `VITE_BACKEND_URL` must handle CORS for local dev.
- `mapSlideToUnit()` skips slides without a valid `channel_id` matching a fetched `Course` — if channels fetch fails, all slides are dropped.
- Supabase env vars are defined but `@supabase/supabase-js` is NOT installed yet. Install before using Supabase APIs.
- `@google/genai` (for `AINavigator`) requires `GEMINI_API_KEY` in `.env.local` — not in `.env.local` by default.
- Playwright is configured under `frontend/` and uses its own web server settings.

## When Updating Customizations

- Update this file (`AGENTS.md`) for always-on repository-wide guidance.
- Use `.github/agents/*.agent.md` for specialized subagent behavior.
- Use `.github/instructions/odoo-elearning.instructions.md` for Odoo-specific coding rules.
