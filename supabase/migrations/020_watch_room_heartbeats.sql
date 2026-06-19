-- Dedicated host-liveness table, intentionally NOT in supabase_realtime so
-- heartbeats do not fan out a watch_rooms row to every client every 20s.
create table public.watch_room_heartbeats (
  room_id      uuid primary key references public.watch_rooms(id) on delete cascade,
  host_id      uuid not null references auth.users(id) on delete cascade,
  heartbeat_at timestamptz not null default now()
);

create index watch_room_heartbeats_host_idx
  on public.watch_room_heartbeats(host_id);

alter table public.watch_room_heartbeats enable row level security;

-- Only the room's current host may upsert its heartbeat. This mirrors the
-- watch_rooms update policy (auth.uid() = host_id).
create policy "watch_room_heartbeats_upsert_host"
  on public.watch_room_heartbeats for all to authenticated
  using ((select auth.uid()) = host_id)
  with check ((select auth.uid()) = host_id);

revoke all on table public.watch_room_heartbeats from anon, authenticated;
grant insert, update, delete on table public.watch_room_heartbeats to authenticated;
grant select, insert, update, delete on table public.watch_room_heartbeats to service_role;

-- NOTE: deliberately NO `alter publication supabase_realtime add table ...`.

-- Update private.claim_room_host_impl to use watch_room_heartbeats with fallback
create or replace function private.claim_room_host_impl(p_room_id uuid)
returns void
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_grace interval := interval '30 seconds';
  v_updated integer := 0;
begin
  if not private.is_room_member(p_room_id) then
    raise exception 'Chỉ thành viên trong phòng mới có thể nhận quyền chủ phòng';
  end if;

  update public.watch_rooms r
  set host_id = (select auth.uid()),
      host_heartbeat_at = now(),
      updated_at = now()
  where r.id = p_room_id
    and (
      -- Case 1: The current host is no longer in the room
      not exists (
        select 1 from public.room_members m
        where m.room_id = r.id and m.user_id = r.host_id
      )
      -- Case 2: The current host is stale
      or (
        -- Both the new heartbeat table row and the old column are stale/missing
        not exists (
          select 1 from public.watch_room_heartbeats hb
          where hb.room_id = r.id and hb.heartbeat_at >= now() - v_grace
        )
        and (
          r.host_heartbeat_at is null
          or r.host_heartbeat_at < now() - v_grace
        )
      )
    );

  get diagnostics v_updated = row_count;
  if v_updated = 0 then
    raise exception 'Chủ phòng hiện tại vẫn đang hoạt động';
  end if;

  -- The new host owns the heartbeat row now.
  insert into public.watch_room_heartbeats (room_id, host_id, heartbeat_at)
  values (p_room_id, (select auth.uid()), now())
  on conflict (room_id) do update
    set host_id = excluded.host_id,
        heartbeat_at = excluded.heartbeat_at;
end;
$$;
