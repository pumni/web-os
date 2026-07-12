create or replace function private.can_join_room(p_room uuid)
returns boolean
language plpgsql
security definer
stable
set search_path = public, private
as $$
declare
  v_host uuid;
  v_max_members int;
  v_current_members int;
begin
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

drop policy if exists "room_members_insert_self" on public.room_members;

create policy "room_members_insert_self" on public.room_members
  for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and private.can_join_room(room_id)
  );
