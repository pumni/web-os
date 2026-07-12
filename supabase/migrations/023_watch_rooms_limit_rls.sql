create or replace function private.can_create_room(p_user uuid)
returns boolean
language plpgsql
security definer
stable
set search_path = public, private
as $$
declare
  v_max_rooms int;
  v_current_rooms int;
begin
  select max_active_rooms into v_max_rooms
  from public.plans
  where tier = private.current_tier(p_user);

  if v_max_rooms is null then
    return true;
  end if;

  select count(*) into v_current_rooms
  from public.watch_rooms
  where host_id = p_user;

  return v_current_rooms < v_max_rooms;
end;
$$;

revoke all on function private.can_create_room(uuid) from public, anon, authenticated;
grant execute on function private.can_create_room(uuid) to authenticated, service_role;

drop policy if exists "watch_rooms_insert_own" on public.watch_rooms;

create policy "watch_rooms_insert_own"
on public.watch_rooms for insert to authenticated
with check (
  (select auth.uid()) = host_id
  and private.can_create_room(host_id)
);
