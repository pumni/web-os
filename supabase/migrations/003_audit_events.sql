create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.audit_events enable row level security;

create policy "audit_events_select_own"
on public.audit_events
for select
to authenticated
using ((select auth.uid()) = actor_id);

create policy "audit_events_insert_own"
on public.audit_events
for insert
to authenticated
with check ((select auth.uid()) = actor_id);

revoke all on table public.audit_events from anon, authenticated;
grant select, insert on table public.audit_events to authenticated;
grant select, insert, update, delete on table public.audit_events to service_role;
