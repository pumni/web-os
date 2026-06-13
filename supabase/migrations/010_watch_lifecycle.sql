-- 1. Thêm cột last_active_at làm nhịp tim (heartbeat)
alter table public.watch_rooms
  add column last_active_at timestamptz not null default now();

-- 2. Đăng ký pg_cron tự động xóa phòng không hoạt động > 6 giờ
create extension if not exists pg_cron;
select cron.schedule(
  'watch-rooms-cleanup',
  '0 * * * *', -- Quét mỗi giờ một lần
  $$ delete from public.watch_rooms
     where last_active_at < now() - interval '6 hours'; $$
);
