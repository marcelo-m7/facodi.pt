---
name: auth-migration
description: "Use when applying a Supabase database migration for user auth features: adding tables, columns, RLS policies, triggers, or Edge Functions for Facodi user auth. Triggers on phrases like 'apply migration', 'add column to profiles', 'new RLS policy', 'create auth table'."
---

# Auth Migration Skill

This skill guides safe schema migrations for Facodi's Supabase user auth schema.

## Workflow

1. **Inspect current state** — run `mcp_supabase_list_tables` and `mcp_supabase_execute_sql` to understand what exists before writing SQL.
2. **Draft migration SQL** — use idempotent `CREATE TABLE IF NOT EXISTS`, `ALTER TABLE … ADD COLUMN IF NOT EXISTS`.
3. **Apply via MCP** — use `mcp_supabase_apply_migration` with a descriptive `name` (snake_case, date prefix optional).
4. **Regenerate types** — run `mcp_supabase_generate_typescript_types` and update `services/supabase.types.ts`.
5. **Security check** — run `mcp_supabase_get_advisors` and fix any new warnings before closing.

## Migration Template

```sql
-- <description>
-- Affected tables: profiles, ...

-- 1. Schema change
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS <col> <type>;

-- 2. RLS policy (if new table)
ALTER TABLE public.<table> ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_rows" ON public.<table>
  FOR ALL USING (auth.uid() = user_id);

-- 3. Index (if queried by new column)
CREATE INDEX IF NOT EXISTS idx_<table>_<col> ON public.<table>(<col>);
```

## Safety Rules

- NEVER use `DROP TABLE` or `DROP COLUMN` without explicit user confirmation.
- NEVER set `SECURITY DEFINER` on a function without a locked `search_path TO ''`.
- ALL new tables must have `ENABLE ROW LEVEL SECURITY` + at least one policy.
- After adding RLS policies that call `auth.uid()`, confirm the `initplan` pattern is used (use `(SELECT auth.uid())` not `auth.uid()` inline) to avoid query plan regression.
- Role escalation (`profiles.role`) must only be changed by server-side trigger — include a guard trigger if the feature touches `role`.

## Auth-Specific Patterns

```sql
-- Guard against client-side role escalation
CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '' AS $$
BEGIN
  IF NEW.role <> OLD.role AND (SELECT auth.role()) <> 'service_role' THEN
    RAISE EXCEPTION 'role field is read-only for clients';
  END IF;
  RETURN NEW;
END;
$$;
```
