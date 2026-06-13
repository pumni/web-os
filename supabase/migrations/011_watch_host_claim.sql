-- 1. Heartbeat riêng cho host-liveness (TÁCH khỏi last_active_at vốn bị
--    member khác bump khi thao tác queue).
alter table public.watch_rooms
  add column host_heartbeat_at timestamptz not null default now();

-- 2. RPC cho thành viên "nhận quyền chủ phòng" khi host vắng mặt.
--    Chỉ cho phép khi heartbeat của host cũ hơn 30s HOẶC host không còn là
--    thành viên. Atomic: người claim đầu tiên bump heartbeat → các claim sau
--    thấy heartbeat mới → bị từ chối.
create or replace function public.claim_room_host(p_room_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_grace interval := interval '30 seconds';
begin
  if not public.is_room_member(p_room_id) then
    raise exception 'Chỉ thành viên trong phòng mới có thể nhận quyền chủ phòng';
  end if;

  if not exists (
    select 1 from public.watch_rooms r
    where r.id = p_room_id
      and (
        r.host_heartbeat_at < now() - v_grace
        or not exists (
          select 1 from public.room_members m
          where m.room_id = r.id and m.user_id = r.host_id
        )
      )
  ) then
    raise exception 'Chủ phòng hiện tại vẫn đang hoạt động';
  end if;

  update public.watch_rooms
  set host_id = (select auth.uid()),
      host_heartbeat_at = now(),
      updated_at = now()
  where id = p_room_id;
end;
$$;

revoke all on function public.claim_room_host(uuid) from public, anon;
grant execute on function public.claim_room_host(uuid) to authenticated;
