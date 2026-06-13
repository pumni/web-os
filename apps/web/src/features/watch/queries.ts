import "server-only";

import { requireUser } from "@pumni/auth";
import { createSupabaseServerClient } from "@pumni/supabase/server";
import type { Room, QueueItem } from "./types";

/**
 * Idempotently register the caller as a member of the room so RLS lets them
 * read and edit the queue. Called during the room page's (dynamic) render, so
 * it is deliberately side-effect-light: a plain INSERT (room_members rows are
 * immutable and the table grants no UPDATE — upsert's ON CONFLICT DO UPDATE
 * would be denied) with a duplicate treated as success, and NO cache
 * revalidation (revalidatePath/revalidateTag are illegal during render).
 */
export async function ensureRoomMembership(roomId: string): Promise<void> {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("room_members")
    .insert({ room_id: roomId, user_id: user.id });
  if (error && error.code !== "23505") {
    console.error("Failed to ensure room membership:", error.message);
    throw new Error(error.message);
  }
}

/** Reads a single watch room from database for initial server-side render. */
export async function getRoom(roomId: string): Promise<Room | null> {
  await requireUser();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("watch_rooms")
    .select("id, code, host_id, source_type, source_ref, is_playing, anchor_position, anchor_server_ts, playback_rate, created_at, updated_at, current_queue_item_id, last_active_at, host_heartbeat_at")
    .eq("id", roomId)
    .maybeSingle();

  if (error) {
    console.error("Error fetching watch room:", error);
    return null;
  }
  return data;
}

/** Reads all watch queue items for a room, ordered by position. */
export async function getQueue(roomId: string): Promise<QueueItem[]> {
  await requireUser();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("watch_queue_items")
    .select("id, room_id, position, source_type, source_ref, title, added_by, created_at")
    .eq("room_id", roomId)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching watch queue:", error);
    return [];
  }
  return data || [];
}
