-- GDPR/ePrivacy compliance rollout
-- 1) auditable consent records
-- 2) account deletion audit trail

create table if not exists public.consent_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  consent_type text not null check (consent_type in ('cookie', 'legal')),
  consent_source text not null,
  consent_version text not null,
  preferences jsonb not null default '{}'::jsonb,
  accepted_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_consent_records_user_id on public.consent_records(user_id);
create index if not exists idx_consent_records_accepted_at on public.consent_records(accepted_at desc);

alter table public.consent_records enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'consent_records'
      and policyname = 'consent_records_select_own'
  ) then
    create policy consent_records_select_own
    on public.consent_records
    for select
    using (auth.uid() = user_id);
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'consent_records'
      and policyname = 'consent_records_insert_own'
  ) then
    create policy consent_records_insert_own
    on public.consent_records
    for insert
    with check (auth.uid() = user_id);
  end if;
end;
$$;

create table if not exists public.account_deletion_audit (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  status text not null check (status in ('requested', 'failed', 'completed')),
  reason text,
  event_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_account_deletion_audit_user_id on public.account_deletion_audit(user_id);
create index if not exists idx_account_deletion_audit_event_at on public.account_deletion_audit(event_at desc);

alter table public.account_deletion_audit enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'account_deletion_audit'
      and policyname = 'account_deletion_audit_select_own'
  ) then
    create policy account_deletion_audit_select_own
    on public.account_deletion_audit
    for select
    using (auth.uid() = user_id);
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'account_deletion_audit'
      and policyname = 'account_deletion_audit_insert_own'
  ) then
    create policy account_deletion_audit_insert_own
    on public.account_deletion_audit
    for insert
    with check (auth.uid() = user_id);
  end if;
end;
$$;
