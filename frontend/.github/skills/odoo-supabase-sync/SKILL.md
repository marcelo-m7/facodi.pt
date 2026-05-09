---
name: odoo-supabase-sync
description: "Use when syncing Odoo eLearning course/enrollment data to Supabase. Triggers: 'sync Odoo to Supabase', 'importar cursos do Odoo', 'enrollments migration', 'criar Postman collection Odoo', 'lendo cursos inscritos', 'sincronizar dados de cursos'."
user-invocable: true
---

# Skill: Odoo → Supabase Course Sync

## Overview

This skill guides the agent through the full pipeline:
1. **Explore** Odoo eLearning records (all enrolled courses + lessons)
2. **Document** the API as a Postman collection in "My Workspace"
3. **Migrate** the data into Supabase `public` schema

---

## Phase 1 — Read Odoo Enrolled Courses

### Credentials (from `.env`)

| Var | Value |
|-----|-------|
| `ODOO_HOST` | `https://edu-facodi.odoo.com` |
| `ODOO_DB` | `edu-facodi` |
| `ODOO_USERNAME` | see `.env` |
| `ODOO_PASSWORD` | see `.env` |

> Never expose credentials in Postman collection values; use variables.

### Step 1 — Authenticate

```
POST https://edu-facodi.odoo.com/web/session/authenticate
Content-Type: application/json

{
  "jsonrpc": "2.0",
  "method": "call",
  "id": null,
  "params": {
    "db": "edu-facodi",
    "login": "{{ODOO_USERNAME}}",
    "password": "{{ODOO_PASSWORD}}"
  }
}
```

Save the `session_id` cookie. All subsequent requests must carry it.

### Step 2 — List ALL Enrolled Courses (`slide.channel`)

Fetch **all enrollment modes** (not just `public`):

```
POST /web/dataset/call_kw
{
  "jsonrpc": "2.0",
  "method": "call",
  "params": {
    "model": "slide.channel",
    "method": "search_read",
    "args": [[]],
    "kwargs": {
      "fields": [
        "id", "name", "description", "description_short",
        "enroll", "members_count", "total_slides",
        "website_absolute_url", "total_time",
        "x_facodi_source_institution", "x_facodi_curriculum_version",
        "x_facodi_workload_hours", "x_facodi_primary_language",
        "x_facodi_content_license", "x_facodi_project_name"
      ],
      "limit": 500,
      "offset": 0
    }
  }
}
```

Key `enroll` values: `"public"`, `"invite"`, `"payment"`. Sync all.

### Step 3 — List ALL Slides/Lessons (`slide.slide`)

```
POST /web/dataset/call_kw
{
  "jsonrpc": "2.0",
  "method": "call",
  "params": {
    "model": "slide.slide",
    "method": "search_read",
    "args": [[]],
    "kwargs": {
      "fields": [
        "id", "name", "description", "html_content",
        "channel_id", "category_id", "sequence",
        "completion_time", "is_preview", "slide_category",
        "is_category", "website_absolute_url", "video_url",
        "x_facodi_unit_code", "x_facodi_duration_minutes",
        "x_facodi_source_institution", "x_facodi_editorial_state"
      ],
      "limit": 2000,
      "offset": 0,
      "order": "channel_id asc, sequence asc, id asc"
    }
  }
}
```

### Step 4 — List Enrollment Records (`slide.channel.partner`)

To fetch actual student enrollments:

```
POST /web/dataset/call_kw
{
  "jsonrpc": "2.0",
  "method": "call",
  "params": {
    "model": "slide.channel.partner",
    "method": "search_read",
    "args": [[]],
    "kwargs": {
      "fields": ["id", "channel_id", "partner_id", "completion", "completed_slides_count"],
      "limit": 5000,
      "offset": 0
    }
  }
}
```

---

## Phase 2 — Create Postman Collection

Use `mcp_postman_mcp_getWorkspaces` to find "My Workspace" ID, then `mcp_postman_mcp_createCollection` with:

```json
{
  "name": "Odoo eLearning – Facodi Sync",
  "description": "Endpoints for syncing courses, slides, and enrollments from edu-facodi.odoo.com to Supabase."
}
```

Add folders and requests:
- **Auth**: `POST /web/session/authenticate`
- **Courses**: `POST /web/dataset/call_kw` (slide.channel)
- **Lessons**: `POST /web/dataset/call_kw` (slide.slide)
- **Enrollments**: `POST /web/dataset/call_kw` (slide.channel.partner)

Use Postman environment variables for `{{ODOO_HOST}}`, `{{ODOO_USERNAME}}`, `{{ODOO_PASSWORD}}`.

---

## Phase 3 — Migrate to Supabase

All migrations use `mcp_supabase_apply_migration` targeting the `public` schema.

### 3a — Ensure `courses` table has `enroll` column

```sql
-- migration: add_enroll_to_courses
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS enroll TEXT DEFAULT 'public',
  ADD COLUMN IF NOT EXISTS odoo_id INTEGER UNIQUE,
  ADD COLUMN IF NOT EXISTS members_count INTEGER DEFAULT 0;
```

### 3b — Ensure `units` table has enrollment-related columns

```sql
-- migration: add_enrollment_fields_to_units
ALTER TABLE public.units
  ADD COLUMN IF NOT EXISTS odoo_id INTEGER UNIQUE,
  ADD COLUMN IF NOT EXISTS editorial_state TEXT,
  ADD COLUMN IF NOT EXISTS slide_category TEXT;
```

### 3c — Upsert course data

Use `mcp_supabase_execute_sql` to upsert Odoo channel records into `public.courses`:

```sql
INSERT INTO public.courses (code, title, description, enroll, odoo_id, members_count, is_active, ...)
VALUES (...)
ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  enroll = EXCLUDED.enroll,
  members_count = EXCLUDED.members_count,
  updated_at = now();
```

### 3d — Upsert unit/slide data

Upsert into `public.units` using `odoo_id` as conflict key:

```sql
INSERT INTO public.units (code, name, summary, course_id, odoo_id, slide_category, ...)
VALUES (...)
ON CONFLICT (odoo_id) DO UPDATE SET
  name = EXCLUDED.name,
  summary = EXCLUDED.summary,
  editorial_state = EXCLUDED.editorial_state,
  updated_at = now();
```

### 3e — Post-migration checklist

After each migration:
1. Run `mcp_supabase_get_advisors` to check for new RLS/security warnings.
2. Run `mcp_supabase_generate_typescript_types` and update `services/supabase.types.ts`.
3. Validate `Course.id → CurricularUnit.courseId` joins are not broken.

---

## Mapping Reference

| Odoo (`slide.channel`) | Supabase `public.courses` |
|------------------------|--------------------------|
| `id` | `odoo_id` |
| `name` | `title` |
| `description` | `description` |
| `enroll` | `enroll` |
| `members_count` | `members_count` |
| `x_facodi_source_institution` | `institution` |
| `x_facodi_curriculum_version` | `curriculum_version` |
| `x_facodi_workload_hours` | computed `ects_total` |
| `x_facodi_primary_language` | `language_code` |
| `x_facodi_project_name` | `school` |

| Odoo (`slide.slide`) | Supabase `public.units` |
|----------------------|------------------------|
| `id` | `odoo_id` |
| `name` | `name` |
| `description` | `summary` |
| `channel_id[0]` | links to `courses.odoo_id` |
| `x_facodi_unit_code` | `unit_code` |
| `x_facodi_duration_minutes` | contributes to `duration` |
| `slide_category` | `slide_category` |
| `x_facodi_editorial_state` | `editorial_state` |

---

## Security Rules

- Never commit `ODOO_USERNAME` or `ODOO_PASSWORD` to version control.
- In Postman, store credentials as environment variables only.
- In Supabase, use `VITE_SUPABASE_PUBLISHABLE_KEY` (never service role key in frontend).
- Server-side scripts that need write access must use service role key only in Edge Functions.
