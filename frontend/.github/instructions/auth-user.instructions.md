---
description: "Use when implementing or reviewing Supabase Auth, user session, profile reads, favorites, playlist progress, or any user-specific feature in the Facodi frontend."
applyTo: "{services/supabase.ts,services/catalogSource.ts,contexts/**/*.tsx,hooks/use*.ts,components/auth/**,components/user/**,App.tsx,types.ts}"
---

# Facodi User Auth — Implementation Rules

## Supabase Client Singleton

- **Only one client instance**. Always import from `services/supabase.ts`.  
- `services/supabase.ts` must call `createClient(VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY)` once and export as `supabase`.
- `services/catalogSource.ts` must migrate its internal client to import from `services/supabase.ts` (do not keep two clients).

## Auth Flow

- Use `supabase.auth.onAuthStateChange` inside an `AuthContext` provider mounted in `App.tsx`.
- Expose `user`, `session`, `profile`, and `signOut` via React Context — do not pass as props.
- On session restore, fetch `public.profiles` using `user.id` and store in context.
- Do **not** store JWT or session tokens in `localStorage` manually; Supabase handles this.

## Profile Access

- Read profile from `public.profiles` (RLS: each user sees own row + public read for display fields).
- Never query `auth.users` from the frontend.
- Profile fields available for display: `username`, `display_name`, `avatar_url`, `bio`, `role`.
- `role` is read-only from frontend; escalation is server-side only.

## Database Schema (already in production)

```
public.profiles          — id uuid (= auth.users.id), username, display_name, avatar_url, bio, avatar_path, role, submissions_count
public.favorites         — id, user_id, video_id
public.playlist_progress — id, user_id, playlist_id, video_id, watched, last_position_seconds
public.user_follows      — (follower ↔ following)
public.user_social_accounts — user_id, platform, url
public.notifications     — user_id, ...
public.comments          — user_id, ...
```

- `handle_new_user()` trigger auto-inserts into `profiles` on every `auth.users` insert.
- No migration is needed to create these tables.

## Migrations

- Apply schema changes only via `mcp_supabase_apply_migration`.
- Name migrations descriptively (e.g. `add_username_unique_constraint`, `add_unit_progress_table`).
- Every migration that adds columns must check RLS remains correct.
- Run `mcp_supabase_get_advisors` after migrations to catch new security warnings.

## Type Safety

- Run `mcp_supabase_generate_typescript_types` after every schema change and commit the output to `services/supabase.types.ts`.
- Import generated types in `services/supabase.ts` and use them for all Supabase queries.

## Security Constraints

- Never expose service role key in frontend or `.env.local.example`.
- Never read private fields from `auth.users` (email, phone, etc.) — use `public.profiles` only.
- `profiles.role` must only be changed by a server-side trigger or Edge Function — not by the client.
- Storage: if uploading avatars, use the RLS-protected `avatars` bucket and store path in `profiles.avatar_path`.

## Checklist Before Merging Auth Code

- [ ] Single Supabase client (imported from `services/supabase.ts`)
- [ ] `AuthContext` provides `user`, `profile`, `session`, `signOut`
- [ ] `onAuthStateChange` subscription cleaned up in `useEffect` return
- [ ] No manual JWT storage
- [ ] TypeScript types updated from `mcp_supabase_generate_typescript_types`
- [ ] RLS policies verified for any new tables
- [ ] `mcp_supabase_get_advisors` shows no new warnings
