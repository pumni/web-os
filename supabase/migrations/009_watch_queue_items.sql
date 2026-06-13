-- 1. Bảng danh sách playlist chung
create table public.watch_queue_items (
  id          uuid primary key default gen_random_uuid(),
  room_id     uuid not null references public.watch_rooms(id) on delete cascade,
  position    double precision not null,            -- fractional indexing
  source_type public.watch_source_type not null,
  source_ref  text not null,
  title       text,
  added_by    uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now()
);

create index watch_queue_items_room_pos_idx on public.watch_queue_items (room_id, position);

alter table public.watch_queue_items enable row level security;

-- Tất cả thao tác CRUD trên queue đều được bảo vệ bởi hàm is_room_member() và kiểm tra auth.uid()
create policy "watch_queue_select" on public.watch_queue_items
  for select to authenticated using (public.is_room_member(room_id) and auth.uid() is not null);

create policy "watch_queue_insert" on public.watch_queue_items
  for insert to authenticated with check (public.is_room_member(room_id) and auth.uid() is not null);

create policy "watch_queue_update" on public.watch_queue_items
  for update to authenticated 
  using (public.is_room_member(room_id) and auth.uid() is not null) 
  with check (public.is_room_member(room_id) and auth.uid() is not null);

create policy "watch_queue_delete" on public.watch_queue_items
  for delete to authenticated using (public.is_room_member(room_id) and auth.uid() is not null);

revoke all on table public.watch_queue_items from anon, authenticated;
grant select, insert, update, delete on table public.watch_queue_items to authenticated;
grant select, insert, update, delete on table public.watch_queue_items to service_role;

-- 2. Thêm cột tham chiếu video hiện tại đang phát vào watch_rooms
alter table public.watch_rooms
  add column current_queue_item_id uuid
  references public.watch_queue_items(id) on delete set null;

alter publication supabase_realtime add table public.watch_queue_items;
