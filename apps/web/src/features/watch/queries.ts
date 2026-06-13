import "server-only";

import { requireUser } from "@pumni/auth";
import { createSupabaseServerClient } from "@pumni/supabase/server";
import type { Room } from "./types";

/** Reads a single watch room from database for initial server-side render. */
export async function getRoom(roomId: string): Promise<Room | null> {
  await requireUser();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("watch_rooms")
    .select("id, code, host_id, source_type, source_ref, is_playing, anchor_position, anchor_server_ts, playback_rate, created_at, updated_at")
    .eq("id", roomId)
    .maybeSingle();

  if (error) {
    console.error("Error fetching watch room:", error);
    return null;
  }
  return data;
}
