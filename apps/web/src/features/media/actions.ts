"use server";

import { updateTag } from "next/cache";
import { requireUser } from "@pumni/auth";
import { createSupabaseServerClient } from "@pumni/supabase/server";
import {
  reportProgressSchema,
  type ReportProgressInput,
  favoriteMediaSchema,
  type FavoriteMediaInput,
} from "@pumni/validators";

export type ActionResult = { ok: true } | { ok: false; message: string };

export async function reportPlaybackProgress(
  input: ReportProgressInput
): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = reportProgressSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Invalid input data." };
  }

  const { itemId, positionTicks, runtimeTicks, title } = parsed.data;
  // Mark as completed if user watched more than 90% of the media
  const completed = runtimeTicks > 0 && positionTicks / runtimeTicks > 0.9;

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("media_watch_history").upsert(
    {
      user_id: user.id,
      jellyfin_item_id: itemId,
      title,
      position_ticks: positionTicks,
      runtime_ticks: runtimeTicks,
      completed,
      last_watched_at: new Date().toISOString(),
    },
    {
      onConflict: "user_id,jellyfin_item_id",
    }
  );

  if (error) {
    return { ok: false, message: error.message };
  }

  updateTag(`media:resume:${user.id}`);
  return { ok: true };
}

export async function toggleFavorite(
  input: FavoriteMediaInput
): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = favoriteMediaSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Invalid input data." };
  }

  const { itemId, title, mediaType } = parsed.data;
  const supabase = await createSupabaseServerClient();

  const { data: existing, error: fetchError } = await supabase
    .from("media_favorites")
    .select("jellyfin_item_id")
    .eq("user_id", user.id)
    .eq("jellyfin_item_id", itemId)
    .maybeSingle();

  if (fetchError) {
    return { ok: false, message: fetchError.message };
  }

  if (existing) {
    const { error: deleteError } = await supabase
      .from("media_favorites")
      .delete()
      .eq("user_id", user.id)
      .eq("jellyfin_item_id", itemId);

    if (deleteError) {
      return { ok: false, message: deleteError.message };
    }
  } else {
    const { error: insertError } = await supabase.from("media_favorites").insert({
      user_id: user.id,
      jellyfin_item_id: itemId,
      title,
      media_type: mediaType,
    });

    if (insertError) {
      return { ok: false, message: insertError.message };
    }
  }

  updateTag(`media:favorites:${user.id}`);
  return { ok: true };
}
