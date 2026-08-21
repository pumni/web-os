-- migration.template.sql — copy next to the new table's migration, rename, fill in.
--
-- Skeleton for a security-safe migration: schema + RLS + owner policies + minimal
-- grants together. Owner must compare against (select auth.uid()). No
-- using (true) on private data; no anon grant on private tables.
-- Replace <thing>, <thing_id>, <owner_id>, and the policy names.

create table if not exists public.<thing> (
  <thing_id> uuid primary key default gen_random_uuid(),
  <owner_id> uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now ()
);

alter table public.<thing> enable row level security;

-- Owner can read + write their own rows. Both using AND with check compare
-- against auth.uid() — the with check is the real write guard.
revoke all on public.<thing> from anon, authenticated;
grant select, insert, update, delete on public.<thing> to authenticated;

create policy "<thing>_owner_read"  on public.<thing>
  for select to authenticated using (<owner_id> = (select auth.uid()));
create policy "<thing>_owner_write" on public.<thing>
  for all     to authenticated
  using (<owner_id> = (select auth.uid()))
  with check (<owner_id> = (select auth.uid()));
