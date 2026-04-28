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
| `data/playlists.ts` | Static mock `Playlist[]` (fallback) |
| `data/i18n.ts` | `pt`/`en` translation strings via `createTranslator(locale)` |
| `components/` | Page-level React components, one file per route |
| `scripts/validate-frontmatter.js` | Validates YAML/TOML frontmatter in `content/` markdown files |
| `scripts/install-hugo.sh` | Helper to install Hugo for content preview |
| `tests/e2e/routes.spec.ts` | Playwright route smoke tests |

## Commands

Run from the `frontend/` directory:

```sh
npm install          # Install deps
npm run dev          # Dev server on port 3000
npm run build        # Production build
npm run preview      # Preview production build
npm run test:e2e     # Playwright E2E tests (port 4173)
```

## Odoo Integration — Architecture

**Target instance:** `https://edu-facodi.odoo.com`

> **API fix needed** — see [odoo-elearning-frontend.instructions.md](../.github/instructions/odoo-elearning-frontend.instructions.md) for the correct Odoo JSON-RPC format and CORS proxy setup.

**Current pattern (not yet connected):** Frontend → `POST ${VITE_BACKEND_URL}/models/{model}/search_read`
- This custom REST format **is not** Odoo's native API.
- No Vite proxy is configured in `vite.config.ts` yet.
- `VITE_DATA_SOURCE=edu-facodi` (not `'odoo'`) → mock data loads by default.

**Target pattern:** Frontend → Vite dev proxy `/odoo` → Odoo JSON-RPC `/web/dataset/call_kw`
- All Odoo calls become `callKw(model, 'search_read', args, kwargs)` in `catalogSource.ts`.
- Auth via `/web/session/authenticate` before `call_kw`.

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

`.env.local` (never commit — contains real credentials):

| Variable | Values | Effect |
|---|---|---|
| `VITE_DATA_SOURCE` | `odoo` / anything else | `odoo` enables live Odoo path; all other values use mock |
| `VITE_BACKEND_URL` | `https://edu-facodi.odoo.com` | Base URL — will become the Vite proxy target |
| `ODOO_HOST` | `https://edu-facodi.odoo.com` | Odoo XML-RPC host (used by Python tasks in root) |
| `ODOO_DB` | `edu-facodi` | Odoo database name |
| `ODOO_USERNAME` | admin email | Odoo credentials — never commit |
| `ODOO_PASSWORD` | password/API token | Odoo credentials — never commit |
| `GEMINI_API_KEY` | Google AI API key | Required for `AINavigator` component |

> **Current default** (`.env.local`): `VITE_DATA_SOURCE=edu-facodi` → mock data loads. To switch to live Odoo data, change to `VITE_DATA_SOURCE=odoo` AND configure the Vite proxy first.

## Data Flow

```
App.tsx (mount)
  └─ loadCatalogData()            ← services/catalogSource.ts
       ├─ MOCK: returns DEGREES + COURSE_UNITS from data/
       └─ LIVE (VITE_DATA_SOURCE=odoo):
            ├─ POST /models/slide.channel/search_read  → Course[]   ← needs fix to JSON-RPC
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
- The Vite proxy to Odoo is **not yet configured** in `vite.config.ts` — add `server.proxy['/odoo']` before enabling live data.
- `mapSlideToUnit()` skips slides without a valid `channel_id` matching a fetched `Course` — if channels fetch fails, all slides are dropped.
- `@google/genai` (`AINavigator`) is installed and requires `GEMINI_API_KEY` in `.env.local` — add it before using `AINavigator`.
- Playwright uses port **4173** (via `npm run dev -- --port 4173`), not the standard 3000.
- `.env.local` is tracked in `.gitignore` — never commit it; it contains real Odoo credentials.

## When Updating Customizations

- Update this file (`AGENTS.md`) for always-on repository-wide guidance.
- Use `.github/agents/*.agent.md` for specialized subagent behavior.
- Use `.github/instructions/odoo-elearning.instructions.md` for Odoo-specific coding rules.
