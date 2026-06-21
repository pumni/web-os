-- Grant SELECT privilege on watch_room_heartbeats to authenticated users
-- required by PostgREST to execute client-side upsert operations.
grant select on table public.watch_room_heartbeats to authenticated;
