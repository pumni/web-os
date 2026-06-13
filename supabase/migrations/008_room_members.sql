-- 1. Bảng lưu trữ thành viên thực tế của phòng xem chung
create table public.room_members (
  room_id   uuid not null references public.watch_rooms(id) on delete cascade,
  user_id   uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (room_id, user_id)
);

create index room_members_room_idx on public.room_members(room_id);
create index room_members_user_idx on public.room_members(user_id);

alter table public.room_members enable row level security;

-- Cho phép SELECT công khai cho người dùng đã đăng nhập (phục vụ mô hình link-shared)
create policy "room_members_select" on public.room_members
  for select to authenticated using (true);

-- Người dùng chỉ được phép thêm chính mình làm thành viên
create policy "room_members_insert_self" on public.room_members
  for insert to authenticated with check ((select auth.uid()) = user_id);

-- Người dùng chỉ được phép xóa chính mình ra khỏi danh sách thành viên
create policy "room_members_delete_self" on public.room_members
  for delete to authenticated using ((select auth.uid()) = user_id);

revoke all on table public.room_members from anon, authenticated;
grant select, insert, delete on table public.room_members to authenticated;
grant select, insert, delete, update on table public.room_members to service_role;

-- 2. Hàm SECURITY DEFINER kiểm tra tư cách thành viên tránh đệ quy RLS
create or replace function public.is_room_member(p_room_id uuid)
returns boolean
language sql security definer set search_path = public stable
as $$
  select exists(
    select 1 from public.room_members
    where room_id = p_room_id and user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_room_member(uuid) from public, anon;
grant execute on function public.is_room_member(uuid) to authenticated;

-- 3. Hàm RPC chuyển quyền chủ phòng (Host Transfer) thủ công
create or replace function public.transfer_room_host(p_room_id uuid, p_new_host uuid)
returns void
language plpgsql security definer set search_path = public
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

revoke all on function public.transfer_room_host(uuid, uuid) from public, anon;
grant execute on function public.transfer_room_host(uuid, uuid) to authenticated;

-- 4. Hàm RPC rời phòng và dọn dẹp nếu phòng trống (delete-on-empty)
create or replace function public.leave_room(p_room_id uuid)
returns void
language plpgsql security definer set search_path = public
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

revoke all on function public.leave_room(uuid) from public, anon;
grant execute on function public.leave_room(uuid) to authenticated;

alter publication supabase_realtime add table public.room_members;
