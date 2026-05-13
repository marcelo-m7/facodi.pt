# Supabase Migrations & Schema Management

Guidance for AI coding agents managing database schema changes in FACODI via the Supabase MCP tools.

## Quick Start

**When to use `mcp_supabase_apply_migration`:**
- Structural changes (CREATE TABLE, ADD COLUMN, ALTER CONSTRAINT)
- Index creation or modification
- Trigger or function definitions
- Schema-level RLS policy changes
- Data type or constraint alterations

**When NOT to use:**
- Data-only changes (use `mcp_supabase_execute_sql` for SELECT/INSERT/UPDATE/DELETE)
- One-off scripts or temporary queries (use `mcp_supabase_execute_sql`)
- Experimental queries before committing to migrations

## Naming Conventions

Migration names follow snake_case pattern:

```
{ISO_DATE}_{sequence}_{description}
  ↓              ↓           ↓
  20260513       1           add_missing_indexes
```

**Examples:**
- `20260513_1_create_courses_table`
- `20260513_2_add_rls_policies`
- `20260514_1_add_learning_outcomes_index`

**Pattern:**
- Always include the date (YYYYMMDD) for chronological ordering
- Use sequence number (1, 2, 3...) for multiple migrations on the same day
- Use `_` separator, lowercase only
- Descriptor should be action-focused: `add_`, `create_`, `drop_`, `alter_`, `index_`, `migrate_`

## Migration Structure

### Basic DDL Migration

```sql
-- Create table with proper constraints and defaults
CREATE TABLE IF NOT EXISTS public.example_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add comment for documentation
COMMENT ON TABLE public.example_table IS 'Stores example entities for platform';
```

### Migration with RLS

```sql
-- Enable RLS on table
ALTER TABLE public.example_table ENABLE ROW LEVEL SECURITY;

-- Create RLS policy (example: users can read all, write own)
CREATE POLICY "read_example_table" ON public.example_table
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "write_example_table" ON public.example_table
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
```

### Migrations with Triggers

```sql
-- Create or replace trigger function for updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger
DROP TRIGGER IF EXISTS trg_example_updated_at ON public.example_table;
CREATE TRIGGER trg_example_updated_at
  BEFORE UPDATE ON public.example_table
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
```

### Index Creation

```sql
-- Create index for performance optimization
CREATE INDEX IF NOT EXISTS idx_example_email ON public.example_table(email);

-- Comment for documentation
COMMENT ON INDEX public.idx_example_email IS 'Speed up email lookups in authentication';
```

## Safety Practices

### Pre-Migration Checks

Before applying a migration:

1. **Verify table existence** in the target project:
   ```
   Use mcp_supabase_list_tables with verbose=true to inspect current schema
   ```

2. **Check for data conflicts:**
   - UNIQUE constraints may fail on existing data
   - NOT NULL constraints require data population
   - FK constraints must reference existing data

3. **Review RLS implications:**
   - New tables need RLS enabled (default: all access denied)
   - Policies must be defined before application uses the table
   - Test with `pnpm security:check-rls` after migration

4. **Plan for reversibility:**
   - Document how to rollback (DROP instead of CREATE, ALTER, REVERT)
   - Keep old column names if renaming (via comments)
   - Test rollback logic separately

### Example Pre-Check Workflow

1. Run `mcp_supabase_list_tables` to check current schema
2. Run `mcp_supabase_get_advisors type=security` for RLS warnings
3. Review migration SQL for conflicts with existing schema
4. Apply migration with `mcp_supabase_apply_migration`
5. Run `mcp_supabase_list_tables verbose=true` to verify
6. Run security check: `pnpm security:check-rls`
7. Test in application (E2E or manual)

## Integration with Project Workflow

### Step 1: Identify Schema Need

Schema changes arise from:
- Feature implementation (new tables, fields)
- Data contract updates (see [CONTRIBUTING.md](../../CONTRIBUTING.md#critical-data-contracts))
- Performance optimization (indexes)
- RLS policy enforcement

### Step 2: Plan Migration

- Discuss breaking changes in team / PR comments
- Link to feature spec or issue
- Define rollback plan if high-risk
- Check FACODI [Supabase Safety Rules](../../AGENTS.md#supabase-safety-rules)

### Step 3: Apply & Validate

```bash
# If local Supabase development available:
supabase migration new {name}  # Create local migration file
# ... edit migration file ...
supabase db push                # Push to local stack

# For remote project:
# Use mcp_supabase_apply_migration directly in agent workflow
```

### Step 4: Update TypeScript Types

After applying migrations to production:

```bash
pnpm supabase:generate-types
```

This regenerates [services/supabase.types.ts](../../services/supabase.types.ts) for type safety.

## Common Patterns

### Adding a Column to Existing Table

```sql
-- Safe approach: add nullable column first, then backfill, then add constraint
ALTER TABLE public.courses
ADD COLUMN description TEXT;

-- Populate existing rows
UPDATE public.courses
SET description = 'Default description'
WHERE description IS NULL;

-- Make NOT NULL after backfill
ALTER TABLE public.courses
ALTER COLUMN description SET NOT NULL;
```

### Creating Enum-like Type

```sql
-- Use CHECK constraint instead of PostgreSQL ENUM for flexibility
CREATE TABLE public.submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT NOT NULL CHECK (status IN ('draft', 'submitted', 'reviewed', 'approved')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Migrating Data with Foreign Keys

```sql
-- Step 1: Create new table with FK
CREATE TABLE public.units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  name TEXT NOT NULL
);

-- Step 2: Copy/migrate data
INSERT INTO public.units (id, course_id, name)
SELECT gen_random_uuid(), course_id, unit_name
FROM public.legacy_units
WHERE migrated_at IS NOT NULL;

-- Step 3: Drop old table
DROP TABLE IF EXISTS public.legacy_units;
```

## RLS & Security Considerations

Every new table in the `public` schema must have RLS configured:

```sql
-- Step 1: Enable RLS (default-deny)
ALTER TABLE public.new_table ENABLE ROW LEVEL SECURITY;

-- Step 2: Define explicit policies
-- Example: Public read, authenticated write
CREATE POLICY "public_read_new_table" ON public.new_table
  FOR SELECT TO authenticated, anon
  USING (true);

CREATE POLICY "authenticated_write_new_table" ON public.new_table
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);
```

See [AGENTS.md → Supabase Safety Rules](../../AGENTS.md#supabase-safety-rules) for full context.

## Validation & Testing

### Post-Migration Validation

```bash
# Run RLS security check
pnpm security:check-rls

# Regenerate TypeScript types
pnpm supabase:generate-types

# Run E2E tests affecting schema
pnpm test:e2e
```

### Manual Testing

1. Connect to staging/production Supabase project
2. Query the table to verify structure:
   ```sql
   SELECT * FROM information_schema.tables WHERE table_name = 'your_new_table';
   ```
3. Test RLS by switching authentication context
4. Verify indexes are created:
   ```sql
   SELECT indexname FROM pg_indexes WHERE tablename = 'your_new_table';
   ```

## Tool Reference

### `mcp_supabase_apply_migration`

Apply a DDL migration to the project database.

**Parameters:**
- `name` (string): Migration name in snake_case
- `query` (string): SQL DDL statement(s)

**Example:**
```
mcp_supabase_apply_migration(
  name="20260513_1_create_example_table",
  query="CREATE TABLE IF NOT EXISTS public.example_table (...)"
)
```

### `mcp_supabase_list_migrations`

View all applied migrations in the project.

**Usage:** Run before applying new migrations to check for duplicates.

### `mcp_supabase_list_tables`

Inspect current schema structure.

**Parameters:**
- `schemas` (string[]): Schema names to inspect (default: ["public"])
- `verbose` (boolean): Include column details, PKs, FKs (default: false)

**Before migration:** Use `verbose=true` to check existing structure.

### `mcp_supabase_execute_sql`

Execute non-DDL queries (data queries, debugging).

**Do not use for:** CREATE, ALTER, DROP (use `apply_migration` instead).

### `mcp_supabase_get_advisors`

Get security and performance warnings.

**Parameters:**
- `type` (string): "security" or "performance"

**When to run:**
- After applying migrations involving tables or RLS
- Before deploying to production

## References

- **Supabase Docs:** https://supabase.com/docs/guides/database/overview
- **PostgreSQL DDL:** https://www.postgresql.org/docs/current/ddl.html
- **Row Level Security:** https://supabase.com/docs/guides/auth/row-level-security
- **FACODI Safety Rules:** [AGENTS.md](../../AGENTS.md#supabase-safety-rules)
- **Data Contracts:** [CONTRIBUTING.md](../../CONTRIBUTING.md#critical-data-contracts)
- **Project Architecture:** [README.md](../../README.md#arquitetura-atual)

## Example Workflow: Adding a New Catalog Feature

**Scenario:** Add support for course prerequisites via a new junction table.

**Step 1: Plan**
- Table: `course_prerequisites` (course_id → prerequisite_course_id)
- RLS: Public read, no write (admin-only via backend)
- Need index on course_id for fast lookup

**Step 2: Create Migration**
```sql
CREATE TABLE IF NOT EXISTS public.course_prerequisites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  prerequisite_course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(course_id, prerequisite_course_id)
);

CREATE INDEX idx_course_prerequisites_course_id 
ON public.course_prerequisites(course_id);

ALTER TABLE public.course_prerequisites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read" ON public.course_prerequisites
  FOR SELECT TO authenticated, anon USING (true);
```

**Step 3: Apply**
- Run `mcp_supabase_apply_migration` with migration name and query
- Verify with `mcp_supabase_list_tables verbose=true`

**Step 4: Validate**
```bash
pnpm security:check-rls  # Verify RLS
pnpm supabase:generate-types  # Update TS types
```

**Step 5: Integrate**
- Update `services/catalogSource.ts` to load prerequisites
- Add to [types.ts](../../types.ts) Course interface
- Test in E2E suite

---

**Last Updated:** 2026-05-13  
**Scope:** FACODI frontend workspace, Supabase backend
