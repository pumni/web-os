create table if not exists public.media_watch_history (
  user_id uuid not null references auth.users(id) on delete cascade,
  jellyfin_item_id text not null,
  title text not null,
  position_ticks bigint not null default 0,
  runtime_ticks bigint not null default 0,
  completed boolean not null default false,
  last_watched_at timestamptz not null default now(),
  created_at timestamptz not null default now(),

  primary key (user_id, jellyfin_item_id)
);

alter table public.media_watch_history enable row level security;

create policy "media_watch_history_select_own"
on public.media_watch_history
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "media_watch_history_insert_own"
on public.media_watch_history
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "media_watch_history_update_own"
on public.media_watch_history
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "media_watch_history_delete_own"
on public.media_watch_history
for delete
to authenticated
using ((select auth.uid()) = user_id);

revoke all on table public.media_watch_history from anon, authenticated;
grant select, insert, update, delete on table public.media_watch_history to authenticated;
grant select, insert, update, delete on table public.media_watch_history to service_role;


create table if not exists public.media_favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  jellyfin_item_id text not null,
  title text not null,
  media_type text not null,
  created_at timestamptz not null default now(),

  primary key (user_id, jellyfin_item_id),
  constraint media_type_valid check (media_type in ('Movie', 'Series'))
);

alter table public.media_favorites enable row level security;

create policy "media_favorites_select_own"
on public.media_favorites
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "media_favorites_insert_own"
on public.media_favorites
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "media_favorites_delete_own"
on public.media_favorites
for delete
to authenticated
using ((select auth.uid()) = user_id);

revoke all on table public.media_favorites from anon, authenticated;
-- Favorites are toggled (insert/delete only) — no UPDATE policy exists, so no
-- UPDATE grant for authenticated.
grant select, insert, delete on table public.media_favorites to authenticated;
grant select, insert, delete on table public.media_favorites to service_role;
