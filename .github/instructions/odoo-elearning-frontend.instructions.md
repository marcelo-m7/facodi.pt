---
applyTo: "frontend/**"
description: >
  Rules for connecting the FACODI React frontend to the Odoo e-learning API
  (edu-facodi.odoo.com). Apply when modifying catalogSource.ts, vite.config.ts,
  .env.local, or any service that fetches slide.channel / slide.slide data.
---

# Odoo e-Learning Frontend Integration

**Target instance:** `https://edu-facodi.odoo.com` (Odoo SaaS)  
**Credentials in `.env.local`:** `ODOO_HOST`, `ODOO_DB`, `ODOO_USERNAME`, `ODOO_PASSWORD` — never commit.

---

## Current State (as of 2026-04-28)

| Item | Status |
|---|---|
| `VITE_DATA_SOURCE` in `.env.local` | `edu-facodi` — activates **mock** path, not `'odoo'` |
| Vite proxy to Odoo | **Not configured** — `vite.config.ts` has no `server.proxy` |
| `postSearchRead()` in `catalogSource.ts` | Calls `${BACKEND_BASE_URL}/models/{model}/search_read` — custom format, **not** Odoo native |
| Live data | Unreachable until proxy + JSON-RPC refactor are in place |

To enable live Odoo data, change `.env.local`:
```
VITE_DATA_SOURCE=odoo
VITE_BACKEND_URL=https://edu-facodi.odoo.com
```
**However**, this alone won't work without also fixing the API call format and CORS.

---

## Odoo API — Correct Call Format

Odoo SaaS does **not** expose `/models/{model}/search_read`. Use **JSON-RPC**:

```
POST https://edu-facodi.odoo.com/web/dataset/call_kw
Content-Type: application/json

{
  "jsonrpc": "2.0",
  "method": "call",
  "params": {
    "model": "slide.channel",
    "method": "search_read",
    "args": [[["enroll", "=", "public"]]],
    "kwargs": {
      "fields": ["id", "name", "description", "enroll", "total_slides", "total_time", "website_url"],
      "limit": 200,
      "offset": 0
    }
  }
}
```

**Auth**: Odoo JSON-RPC requires a session cookie from a prior `/web/session/authenticate` call. For public `slide.channel` records, the public user session may work.

### Authentication flow (needed before `call_kw`):
```json
POST /web/session/authenticate
{
  "jsonrpc": "2.0",
  "method": "call",
  "params": {
    "db": "edu-facodi",
    "login": "ODOO_USERNAME",
    "password": "ODOO_PASSWORD"
  }
}
```
Returns a session cookie — include it in subsequent calls.

---

## CORS — Dev Proxy via Vite

The browser cannot call `edu-facodi.odoo.com` directly due to CORS. Add a dev proxy in `vite.config.ts`:

```ts
server: {
  proxy: {
    '/odoo': {
      target: 'https://edu-facodi.odoo.com',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/odoo/, ''),
      secure: true,
    }
  }
}
```

Then in `catalogSource.ts`, the base URL becomes `/odoo` in dev and the full Odoo URL in production.

**Production**: Requires a real backend proxy or Odoo CORS allowlist.

---

## Refactoring Plan for `catalogSource.ts`

Replace `postSearchRead()` with a function that calls Odoo JSON-RPC:

1. **Authenticate** once on first call — cache session cookie
2. **`callKw(model, method, args, kwargs)`** — wraps `/web/dataset/call_kw`
3. **Map response** — Odoo JSON-RPC returns `{ result: OdooRecord[] }`, not `{ records: OdooRecord[] }`
4. Keep existing mapper functions (`mapChannelToCourse`, `mapSlideToUnit`) — they are correct
5. Keep the `DATA_SOURCE !== 'odoo'` mock fallback guard — it is still needed

### Odoo response shape:
```ts
type OdooJsonRpcResponse = {
  jsonrpc: string;
  id: null;
  result: OdooRecord[];   // ← top-level result, NOT result.records
};
```

---

## Odoo Model → Frontend Type Mapping

| Odoo model | Frontend type | Key fields |
|---|---|---|
| `slide.channel` | `Course` | `id`, `name`, `description`, `enroll`, `total_slides`, `total_time` |
| `slide.slide` | `CurricularUnit` | `id`, `name`, `description`, `channel_id`, `sequence`, `completion_time`, `tag_ids`, `is_preview`, `slide_category` |

**Course ID normalization** — already implemented in `normalizeCourseId()`:
- "engenharia" + "tecnologias da informação" → `LESTI`
- "design de comunicação" → `LDCOM`
- Otherwise → `ODOO-{channelId}`

---

## Files to Change

| File | Change |
|---|---|
| `frontend/services/catalogSource.ts` | Replace `postSearchRead()` with Odoo JSON-RPC client |
| `frontend/vite.config.ts` | Add `server.proxy` for `/odoo` → Odoo host |
| `frontend/.env.local` | Set `VITE_DATA_SOURCE=odoo`, adjust `VITE_BACKEND_URL` |

**Do not change** `types.ts`, mapper functions, or component files unless the shape of `Course` / `CurricularUnit` changes.

---

## Security Rules

- Load credentials from `import.meta.env.VITE_*` only; never hardcode.
- Do not expose `ODOO_PASSWORD` in browser network calls — route auth through a proxy or use an Odoo API key if available.
- `.env.local` is in `.gitignore`; confirm before committing.
