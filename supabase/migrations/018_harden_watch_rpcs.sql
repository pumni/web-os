-- Harden Watch room RPCs and policies.
-- Moves security definer implementations to the private schema and defines public wrappers as security invoker.

create schema if not exists private;

-- 1. Drop policies that depend on public.is_room_member(uuid) first to resolve dependencies
drop policy if exists "watch_queue_select" on public.watch_queue_items;
drop policy if exists "watch_queue_insert" on public.watch_queue_items;
drop policy if exists "watch_queue_update" on public.watch_queue_items;
drop policy if exists "watch_queue_delete" on public.watch_queue_items;

-- 2. Drop existing public functions in dependency order (dependent wrappers first, then helpers)
drop function if exists public.claim_room_host(uuid);
drop function if exists public.is_room_member(uuid);
drop function if exists public.transfer_room_host(uuid, uuid);
drop function if exists public.leave_room(uuid);
drop function if exists public.get_public_profiles(uuid[]);

-- 3. Define private schema security definer helper functions
create or replace function private.is_room_member(p_room_id uuid)
returns boolean
language sql
security definer
set search_path = public, private
stable
as $$
  select exists (
    select 1
    from public.room_members
    where room_id = p_room_id
      and user_id = (select auth.uid())
  );
$$;

create or replace function private.transfer_room_host_impl(p_room_id uuid, p_new_host uuid)
returns void
language plpgsql
security definer
set search_path = public, private
as $$
begin
  -- Chỉ host hiện tại mới có quyền thực hiện
  if not exists (
    select 1 from public.watch_rooms
    where id = p_room_id and host_id = (select auth.uid())
  ) then
    raise exception 'Chỉ quản phòng (host) hiện tại mới có quyền chuyển quyền chủ phòng';
  end if;

  -- Người nhận quyền phải là thành viên hiện tại của phòng
  if not exists (
    select 1 from public.room_members
    where room_id = p_room_id and user_id = p_new_host
  ) then
    raise exception 'Người nhận quyền chủ phòng phải là thành viên trong phòng';
  end if;

  update public.watch_rooms 
  set host_id = p_new_host, updated_at = now()
  where id = p_room_id;
end;
$$;

create or replace function private.leave_room_impl(p_room_id uuid)
returns void
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_member_count int;
begin
  -- Xóa người gọi khỏi room_members
  delete from public.room_members
  where room_id = p_room_id and user_id = (select auth.uid());

  -- Đếm số thành viên còn lại
  select count(*) into v_member_count
  from public.room_members
  where room_id = p_room_id;

  -- Nếu không còn ai, xóa phòng (delete-on-empty)
  if v_member_count = 0 then
    delete from public.watch_rooms
    where id = p_room_id;
  end if;
end;
$$;

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
      r.host_heartbeat_at < now() - v_grace
      or not exists (
        select 1 from public.room_members m
        where m.room_id = r.id and m.user_id = r.host_id
      )
    );

  get diagnostics v_updated = row_count;

  if v_updated = 0 then
    raise exception 'Chủ phòng hiện tại vẫn đang hoạt động';
  end if;
end;
$$;

create or replace function private.get_public_profiles_impl(p_ids uuid[])
returns table (id uuid, username text, avatar_url text)
language sql
security definer
set search_path = public, private
stable
as $$
  select p.id, p.username, p.avatar_url
  from public.profiles p
  where p.id = any(p_ids);
$$;

-- 4. Define public schema security invoker wrappers for PostgREST RPC access
create or replace function public.transfer_room_host(p_room_id uuid, p_new_host uuid)
returns void
language plpgsql
security invoker
set search_path = public, private
as $$
begin
  perform private.transfer_room_host_impl(p_room_id, p_new_host);
end;
$$;

create or replace function public.leave_room(p_room_id uuid)
returns void
language plpgsql
security invoker
set search_path = public, private
as $$
begin
  perform private.leave_room_impl(p_room_id);
end;
$$;

create or replace function public.claim_room_host(p_room_id uuid)
returns void
language plpgsql
security invoker
set search_path = public, private
as $$
begin
  perform private.claim_room_host_impl(p_room_id);
end;
$$;

create or replace function public.get_public_profiles(p_ids uuid[])
returns table (id uuid, username text, avatar_url text)
language sql
security invoker
set search_path = public, private
stable
as $$
  select * from private.get_public_profiles_impl(p_ids);
$$;

-- 5. Recreate RLS policies on public.watch_queue_items to use private.is_room_member
create policy "watch_queue_select" on public.watch_queue_items
  for select to authenticated
  using (private.is_room_member(room_id) and (select auth.uid()) is not null);

create policy "watch_queue_insert" on public.watch_queue_items
  for insert to authenticated
  with check (
    private.is_room_member(room_id)
    and added_by = (select auth.uid())
  );

create policy "watch_queue_update" on public.watch_queue_items
  for update to authenticated
  using (private.is_room_member(room_id) and (select auth.uid()) is not null)
  with check (private.is_room_member(room_id) and (select auth.uid()) is not null);

create policy "watch_queue_delete" on public.watch_queue_items
  for delete to authenticated
  using (private.is_room_member(room_id) and (select auth.uid()) is not null);

-- 6. Revoke default execution grants and give explicit grants to authenticated
revoke all on function private.is_room_member(uuid) from public, anon, authenticated;
revoke all on function private.transfer_room_host_impl(uuid, uuid) from public, anon, authenticated;
revoke all on function private.leave_room_impl(uuid) from public, anon, authenticated;
revoke all on function private.claim_room_host_impl(uuid) from public, anon, authenticated;
revoke all on function private.get_public_profiles_impl(uuid[]) from public, anon, authenticated;

grant execute on function private.is_room_member(uuid) to authenticated;
grant execute on function private.transfer_room_host_impl(uuid, uuid) to authenticated;
grant execute on function private.leave_room_impl(uuid) to authenticated;
grant execute on function private.claim_room_host_impl(uuid) to authenticated;
grant execute on function private.get_public_profiles_impl(uuid[]) to authenticated;

revoke all on function public.transfer_room_host(uuid, uuid) from public, anon, authenticated;
revoke all on function public.leave_room(uuid) from public, anon, authenticated;
revoke all on function public.claim_room_host(uuid) from public, anon, authenticated;
revoke all on function public.get_public_profiles(uuid[]) from public, anon, authenticated;

grant execute on function public.transfer_room_host(uuid, uuid) to authenticated;
grant execute on function public.leave_room(uuid) to authenticated;
grant execute on function public.claim_room_host(uuid) to authenticated;
grant execute on function public.get_public_profiles(uuid[]) to authenticated;
