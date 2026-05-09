---
description: "Use when reading or writing Odoo eLearning data (slide.channel, slide.slide, slide.channel.partner), implementing the Odoo JSON-RPC client in catalogSource.ts, or debugging Odoo sync issues."
applyTo: "services/catalogSource.ts"
---

# Odoo eLearning API — Integration Rules

## Instance

- Host: `https://edu-facodi.odoo.com`
- Database: `edu-facodi`
- Auth endpoint: `POST /web/session/authenticate`
- Data endpoint: `POST /web/dataset/call_kw`

## Authentication

Always call `/web/session/authenticate` first and include the returned `session_id` cookie in all subsequent requests. The frontend uses `ensureSession()` in `services/catalogSource.ts` for lazy auth caching.

## Key Models

| Model | Description | Filter for enrollment |
|-------|-------------|----------------------|
| `slide.channel` | Courses (eLearning channels) | `enroll` field: `public`, `invite`, `payment` |
| `slide.slide` | Lessons/curricular units | `is_category=false` to exclude section headers |
| `slide.channel.partner` | Student enrollment records | join via `channel_id` |

## Enrollment Modes

The current `catalogSource.ts` only reads `enroll = 'public'`. To get **all enrolled courses**, remove the filter or use `['enroll', 'in', ['public', 'invite', 'payment']]`.

## Custom Fields (x_facodi_*)

All custom Facodi fields on Odoo models are prefixed `x_facodi_`:

| Field | Model | Maps to |
|-------|-------|---------|
| `x_facodi_unit_code` | `slide.slide` | `units.unit_code` |
| `x_facodi_duration_minutes` | `slide.slide` | `units.duration` |
| `x_facodi_source_institution` | both | `institution` |
| `x_facodi_curriculum_version` | `slide.channel` | `courses.curriculum_version` |
| `x_facodi_workload_hours` | `slide.channel` | drives `ects_total` (÷25) |
| `x_facodi_primary_language` | `slide.channel` | `language_code` |
| `x_facodi_content_license` | `slide.channel` | `content_license` |
| `x_facodi_project_name` | `slide.channel` | `school` |
| `x_facodi_editorial_state` | `slide.slide` | `editorial_state` |

## Pagination

- Channels: `limit: 200` (current); increase to `500` if more than 200 courses expected.
- Slides: `limit: 2000` (current); paginate with `offset` if count grows.
- Enrollment records: paginate with `limit: 1000, offset: N`.

## Section Parsing

`category_id[1]` on `slide.slide` contains the section name (e.g., `"1o Ano - 1o Semestre"`). Parse with `parseSectionYearSemester()` in `catalogSource.ts`.

## Dev Proxy

In dev (`VITE_DATA_SOURCE=odoo`), Vite proxies `/odoo → https://edu-facodi.odoo.com` to avoid CORS. In production, set `VITE_BACKEND_URL` to a real backend proxy.
