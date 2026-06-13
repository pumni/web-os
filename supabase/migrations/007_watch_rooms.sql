-- Watch-Together rooms. One authoritative playback "intent" row per room.
-- The host (creator) is the only writer of playback fields (enforced by RLS).
create type public.watch_source_type as enum ('youtube', 'url');

create table public.watch_rooms (
  id              uuid primary key default gen_random_uuid(),
  code            text not null unique,                 -- short join code
  host_id         uuid not null references auth.users(id) on delete cascade,
  source_type     public.watch_source_type not null,
  source_ref      text not null,                        -- youtube id OR direct url
  is_playing      boolean not null default false,
  anchor_position double precision not null default 0,  -- seconds into media
  anchor_server_ts timestamptz not null default now(),  -- server clock at anchor
  playback_rate   real not null default 1,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index watch_rooms_code_idx on public.watch_rooms (code);

alter table public.watch_rooms enable row level security;

-- v1 access model: rooms are link/code-shared, not secret. Any authenticated
-- user may read a room (they need its id/code to reach it anyway).
create policy "watch_rooms_select_authenticated"
on public.watch_rooms for select to authenticated
using (true);

-- Only the creator row-owner may insert their own room.
create policy "watch_rooms_insert_own"
on public.watch_rooms for insert to authenticated
with check ((select auth.uid()) = host_id);

-- AUTHORITATIVE CONTROL GATE: only the host mutates playback state.
create policy "watch_rooms_update_host"
on public.watch_rooms for update to authenticated
using ((select auth.uid()) = host_id)
with check ((select auth.uid()) = host_id);

create policy "watch_rooms_delete_host"
on public.watch_rooms for delete to authenticated
using ((select auth.uid()) = host_id);

revoke all on table public.watch_rooms from anon, authenticated;
grant select, insert, update, delete on table public.watch_rooms to authenticated;
grant select, insert, update, delete on table public.watch_rooms to service_role;

-- Enable Realtime for the table
alter publication supabase_realtime add table public.watch_rooms;
