-- Đặt REPLICA IDENTITY FULL cho bảng watch_queue_items để khi có hành động DELETE,
-- Postgres ghi nhận toàn bộ dòng cũ vào WAL (bao gồm cả room_id).
-- Giúp Supabase Realtime lọc được sự kiện DELETE theo room_id và đồng bộ tới client.
alter table public.watch_queue_items replica identity full;
