-- Nới lỏng RLS đọc hàng chờ watch_queue_items để khắc phục việc mất đồng bộ các sự kiện
-- DELETE (do room_id bị lọc sạch/redact trong payload WAL cũ) và loại bỏ race condition
-- giữa tiến trình kết nối Realtime và API join phòng xem chung.
-- Các quyền ghi (INSERT, UPDATE, DELETE) vẫn được kiểm tra thành viên phòng nghiêm ngặt.

drop policy if exists "watch_queue_select" on public.watch_queue_items;

create policy "watch_queue_select" on public.watch_queue_items
  for select to authenticated using (auth.uid() is not null);
