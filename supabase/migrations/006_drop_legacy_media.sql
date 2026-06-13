-- Retire the legacy Cinema feature (Jellyfin). Tables/policies/grants are
-- dropped; data is intentionally discarded (feature deprecated 2026-06-13).
drop table if exists public.media_favorites;
drop table if exists public.media_watch_history;
