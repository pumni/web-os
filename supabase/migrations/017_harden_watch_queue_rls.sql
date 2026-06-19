-- Harden watch queue access after the realtime compatibility relaxation.
-- Queue data is room-member scoped; authenticated users should not be able to
-- read queue rows for rooms they have not joined.

drop policy if exists "watch_queue_select" on public.watch_queue_items;
drop policy if exists "watch_queue_insert" on public.watch_queue_items;
drop policy if exists "watch_queue_update" on public.watch_queue_items;
drop policy if exists "watch_queue_delete" on public.watch_queue_items;

create policy "watch_queue_select" on public.watch_queue_items
  for select to authenticated
  using (public.is_room_member(room_id) and (select auth.uid()) is not null);

create policy "watch_queue_insert" on public.watch_queue_items
  for insert to authenticated
  with check (
    public.is_room_member(room_id)
    and added_by = (select auth.uid())
  );

create policy "watch_queue_update" on public.watch_queue_items
  for update to authenticated
  using (public.is_room_member(room_id) and (select auth.uid()) is not null)
  with check (public.is_room_member(room_id) and (select auth.uid()) is not null);

create policy "watch_queue_delete" on public.watch_queue_items
  for delete to authenticated
  using (public.is_room_member(room_id) and (select auth.uid()) is not null);

revoke all on table public.watch_queue_items from anon, authenticated;
grant select, insert, delete on table public.watch_queue_items to authenticated;
grant update(position) on table public.watch_queue_items to authenticated;
grant select, insert, update, delete on table public.watch_queue_items to service_role;
