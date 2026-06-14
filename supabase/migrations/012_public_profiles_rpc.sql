-- Cho phép thành viên phòng đọc THÔNG TIN CÔNG KHAI (chỉ username + avatar) của
-- người khác để hiển thị trong danh sách người xem. KHÔNG nới RLS toàn bảng
-- profiles (tránh lộ full_name/timestamps). RPC SECURITY DEFINER trả đúng 3 cột.
create or replace function public.get_public_profiles(p_ids uuid[])
returns table (id uuid, username text, avatar_url text)
language sql security definer set search_path = public stable
as $$
  select p.id, p.username, p.avatar_url
  from public.profiles p
  where p.id = any(p_ids);
$$;

revoke all on function public.get_public_profiles(uuid[]) from public, anon;
grant execute on function public.get_public_profiles(uuid[]) to authenticated;
