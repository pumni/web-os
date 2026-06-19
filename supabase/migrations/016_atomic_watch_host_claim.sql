-- Make host claiming atomic: the stale/missing-host predicate must live inside
-- the UPDATE so concurrent claim attempts cannot all pass a separate precheck.
create or replace function public.claim_room_host(p_room_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_grace interval := interval '30 seconds';
  v_updated integer := 0;
begin
  if not public.is_room_member(p_room_id) then
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

revoke all on function public.claim_room_host(uuid) from public, anon;
grant execute on function public.claim_room_host(uuid) to authenticated;
