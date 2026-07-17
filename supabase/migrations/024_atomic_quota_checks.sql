-- Make the plan quota checks atomic. 023 read the room/member count in a
-- separate step from the INSERT that RLS was guarding, so concurrent requests
-- could all pass the same precheck and overshoot the plan limit -- the exact
-- failure 016_atomic_watch_host_claim.sql was written to avoid.
--
-- Two changes per function, both required:
--   1. Take a transaction-scoped advisory lock on the contended key, so racing
--      transactions serialise instead of interleaving check and insert.
--   2. Mark the function volatile. A stable function reuses the calling
--      INSERT's snapshot, so a waiting transaction would still not see the row
--      the previous one just committed. Volatile takes a fresh snapshot per
--      inner query, which is what makes the recount observe it.
--
-- Signatures, policies, and grants are unchanged from 023.

create or replace function private.can_create_room(p_user uuid)
returns boolean
language plpgsql
security definer
volatile
set search_path = public, private
as $$
declare
  v_max_rooms int;
  v_current_rooms int;
begin
  -- Serialise concurrent room creation by this host. Released at commit.
  perform pg_advisory_xact_lock(hashtextextended(p_user::text, 0));

  select max_active_rooms into v_max_rooms
  from public.plans
  where tier = private.current_tier(p_user);

  if v_max_rooms is null then
    return true;
  end if;

  select count(*) into v_current_rooms
  from public.watch_rooms r
  where r.host_id = p_user
    and (
      r.last_active_at > now() - interval '24 hours'
      or exists (select 1 from public.room_members m where m.room_id = r.id)
    );

  return v_current_rooms < v_max_rooms;
end;
$$;

revoke all on function private.can_create_room(uuid) from public, anon, authenticated;
grant execute on function private.can_create_room(uuid) to authenticated, service_role;

create or replace function private.can_join_room(p_room uuid)
returns boolean
language plpgsql
security definer
volatile
set search_path = public, private
as $$
declare
  v_host uuid;
  v_max_members int;
  v_current_members int;
begin
  -- Serialise concurrent joins to this room. Keyed by room, not by joining
  -- user: the contended count is the room's member total.
  perform pg_advisory_xact_lock(hashtextextended(p_room::text, 0));

  select host_id into v_host
  from public.watch_rooms
  where id = p_room;

  if v_host is null then
    return false;
  end if;

  select max_room_members into v_max_members
  from public.plans
  where tier = private.current_tier(v_host);

  if v_max_members is null then
    return true;
  end if;

  select count(*) into v_current_members
  from public.room_members
  where room_id = p_room;

  return v_current_members < v_max_members;
end;
$$;

revoke all on function private.can_join_room(uuid) from public, anon, authenticated;
grant execute on function private.can_join_room(uuid) to authenticated, service_role;
