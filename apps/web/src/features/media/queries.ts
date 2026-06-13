import { getCurrentUser } from "@pumni/auth";
import { getMediaItems, getMediaItemDetail, getPlaybackInfo } from "@pumni/jellyfin";
import { createSupabaseServiceRoleClient } from "@pumni/supabase/service-role";
import { cacheLife, cacheTag } from "next/cache";

export async function getMediaLibrary(options?: {
  type?: "Movie" | "Series";
  limit?: number;
  startIndex?: number;
  searchTerm?: string;
}) {
  const user = await getCurrentUser();
  if (!user) {
    return { Items: [], TotalRecordCount: 0 };
  }
  return fetchMediaLibrary(options || {});
}

async function fetchMediaLibrary(options: {
  type?: "Movie" | "Series";
  limit?: number;
  startIndex?: number;
  searchTerm?: string;
}) {
  "use cache";
  cacheTag("media:library");
  cacheLife("minutes");

  return getMediaItems(options);
}

export async function getMediaDetail(itemId: string) {
  const user = await getCurrentUser();
  if (!user) {
    return null;
  }
  return fetchMediaDetail(itemId);
}

async function fetchMediaDetail(itemId: string) {
  "use cache";
  cacheTag(`media:detail:${itemId}`);
  cacheLife("minutes");

  return getMediaItemDetail(itemId);
}

export async function getMediaPlaybackInfo(itemId: string) {
  const user = await getCurrentUser();
  if (!user) {
    return null;
  }
  return getPlaybackInfo(itemId);
}


export async function getResumeWatching() {
  const user = await getCurrentUser();
  if (!user) {
    return [];
  }
  return fetchResumeWatching(user.id);
}

async function fetchResumeWatching(userId: string) {
  "use cache";
  cacheTag(`media:resume:${userId}`);
  cacheLife("minutes");

  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("media_watch_history")
    .select("user_id, jellyfin_item_id, title, position_ticks, runtime_ticks, completed, last_watched_at, created_at")
    .eq("user_id", userId)
    .eq("completed", false)
    .order("last_watched_at", { ascending: false })
    .limit(10);

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getMediaFavorites() {
  const user = await getCurrentUser();
  if (!user) {
    return [];
  }
  return fetchMediaFavorites(user.id);
}

async function fetchMediaFavorites(userId: string) {
  "use cache";
  cacheTag(`media:favorites:${userId}`);
  cacheLife("minutes");

  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("media_favorites")
    .select("user_id, jellyfin_item_id, title, media_type, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
