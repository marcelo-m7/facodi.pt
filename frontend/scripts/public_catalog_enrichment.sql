-- Public catalog enrichment baseline
-- Requirement: use only schema public for FACODI catalog integration.

begin;

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  title text not null,
  description text,
  ects_total numeric(6,2) not null default 0,
  duration_semesters smallint not null default 6,
  institution text,
  school text,
  degree_type text not null default 'other' check (degree_type in ('bachelor','master','other')),
  language_code varchar(10) not null default 'pt',
  long_description text,
  website_url text,
  curriculum_version text,
  content_license text,
  metadata jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.units (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  code text not null unique,
  name text not null,
  summary text,
  content text,
  content_url text,
  syllabus_url text,
  ects numeric(6,2) not null default 0,
  semester smallint not null default 1,
  year smallint not null default 1,
  category text,
  difficulty text,
  duration text,
  contributor text,
  tags text[] not null default '{}',
  prerequisites text[] not null default '{}',
  unit_code text,
  section_name text,
  website_url text,
  video_url text,
  source_url text,
  metadata jsonb not null default '{}'::jsonb,
  position smallint not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(course_id, position)
);

create table if not exists public.unit_enrichments (
  unit_id uuid primary key references public.units(id) on delete cascade,
  canonical_source text not null default 'supabase',
  source_odoo_id text,
  source_legacy_ref text,
  editorial_state text,
  provenance jsonb not null default '{}'::jsonb,
  ai_summary text,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.learning_outcomes (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references public.units(id) on delete cascade,
  outcome_order smallint not null default 1,
  outcome_text text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(unit_id, outcome_order)
);

create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references public.units(id) on delete cascade,
  resource_type text not null,
  title text,
  url text not null,
  language_code varchar(10),
  license_name text,
  source_provider text,
  position smallint not null default 1,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(unit_id, position)
);

create table if not exists public.content_sync_runs (
  id uuid primary key default gen_random_uuid(),
  source_name text not null,
  status text not null check (status in ('running','success','failed','partial')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  imported_courses integer not null default 0,
  imported_units integer not null default 0,
  imported_resources integer not null default 0,
  imported_outcomes integer not null default 0,
  details jsonb not null default '{}'::jsonb
);

create table if not exists public.content_sync_conflicts (
  id uuid primary key default gen_random_uuid(),
  run_id uuid references public.content_sync_runs(id) on delete set null,
  entity_type text not null,
  entity_key text not null,
  field_name text not null,
  source_value text,
  target_value text,
  resolution text,
  created_at timestamptz not null default now()
);

create index if not exists idx_courses_code on public.courses(code);
create index if not exists idx_units_course_id on public.units(course_id);
create index if not exists idx_units_code on public.units(code);
create index if not exists idx_units_year_semester on public.units(year, semester);
create index if not exists idx_learning_outcomes_unit_id on public.learning_outcomes(unit_id);
create index if not exists idx_resources_unit_id on public.resources(unit_id);
create index if not exists idx_content_sync_runs_started_at on public.content_sync_runs(started_at desc);
create index if not exists idx_content_sync_conflicts_run_id on public.content_sync_conflicts(run_id);

alter table public.courses enable row level security;
alter table public.units enable row level security;
alter table public.unit_enrichments enable row level security;
alter table public.learning_outcomes enable row level security;
alter table public.resources enable row level security;
alter table public.content_sync_runs enable row level security;
alter table public.content_sync_conflicts enable row level security;

drop policy if exists public_catalog_read_courses on public.courses;
create policy public_catalog_read_courses on public.courses
  for select to anon, authenticated using (is_active = true);

drop policy if exists public_catalog_read_units on public.units;
create policy public_catalog_read_units on public.units
  for select to anon, authenticated using (true);

drop policy if exists public_catalog_read_unit_enrichments on public.unit_enrichments;
create policy public_catalog_read_unit_enrichments on public.unit_enrichments
  for select to anon, authenticated using (true);

drop policy if exists public_catalog_read_learning_outcomes on public.learning_outcomes;
create policy public_catalog_read_learning_outcomes on public.learning_outcomes
  for select to anon, authenticated using (true);

drop policy if exists public_catalog_read_resources on public.resources;
create policy public_catalog_read_resources on public.resources
  for select to anon, authenticated using (true);

drop policy if exists public_catalog_admin_sync_runs on public.content_sync_runs;
create policy public_catalog_admin_sync_runs on public.content_sync_runs
  for all to authenticated
  using (coalesce(auth.jwt() ->> 'role', '') in ('facodi_editor','service_role'))
  with check (coalesce(auth.jwt() ->> 'role', '') in ('facodi_editor','service_role'));

drop policy if exists public_catalog_admin_sync_conflicts on public.content_sync_conflicts;
create policy public_catalog_admin_sync_conflicts on public.content_sync_conflicts
  for all to authenticated
  using (coalesce(auth.jwt() ->> 'role', '') in ('facodi_editor','service_role'))
  with check (coalesce(auth.jwt() ->> 'role', '') in ('facodi_editor','service_role'));

revoke all privileges on table public.courses from anon, authenticated;
revoke all privileges on table public.units from anon, authenticated;
revoke all privileges on table public.unit_enrichments from anon, authenticated;
revoke all privileges on table public.learning_outcomes from anon, authenticated;
revoke all privileges on table public.resources from anon, authenticated;
revoke all privileges on table public.content_sync_runs from anon, authenticated;
revoke all privileges on table public.content_sync_conflicts from anon, authenticated;

grant usage on schema public to anon, authenticated;
grant select on table public.courses to anon, authenticated;
grant select on table public.units to anon, authenticated;
grant select on table public.unit_enrichments to anon, authenticated;
grant select on table public.learning_outcomes to anon, authenticated;
grant select on table public.resources to anon, authenticated;
grant select, insert, update, delete on table public.content_sync_runs to authenticated;
grant select, insert, update, delete on table public.content_sync_conflicts to authenticated;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_courses_updated_at on public.courses;
create trigger trg_courses_updated_at
before update on public.courses
for each row execute function public.set_updated_at();

drop trigger if exists trg_units_updated_at on public.units;
create trigger trg_units_updated_at
before update on public.units
for each row execute function public.set_updated_at();

drop trigger if exists trg_unit_enrichments_updated_at on public.unit_enrichments;
create trigger trg_unit_enrichments_updated_at
before update on public.unit_enrichments
for each row execute function public.set_updated_at();

drop trigger if exists trg_learning_outcomes_updated_at on public.learning_outcomes;
create trigger trg_learning_outcomes_updated_at
before update on public.learning_outcomes
for each row execute function public.set_updated_at();

drop trigger if exists trg_resources_updated_at on public.resources;
create trigger trg_resources_updated_at
before update on public.resources
for each row execute function public.set_updated_at();

commit;
