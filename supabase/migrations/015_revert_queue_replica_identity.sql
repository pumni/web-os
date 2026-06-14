-- Đưa REPLICA IDENTITY của bảng watch_queue_items về mặc định (default),
-- do dự án đã chuyển sang đồng bộ qua Broadcast và không còn sử dụng postgres_changes cho hàng chờ.
alter table public.watch_queue_items replica identity default;
