import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import { requireUser } from '@pumni/auth';
import type { Database } from '@pumni/supabase';
import { createSupabaseServerClient } from '@pumni/supabase/server';
import { extractYouTubeId, isValidHttpUrl } from './sync-math';

/** Discriminated result returned by every watch server action. */
export type ActionResult<T = void> = { ok: true; data: T } | { ok: false; message: string };

/**
 * Normalize a user-supplied source reference depending on its type:
 *  - `youtube` → extract the 11-char video id (rejecting invalid links).
 *  - `url`     → validate it is an http(s) URL (leaving the string as-is).
 *
 * Returns either the sanitized reference or a ready-to-return failure object.
 */
export function sanitizeSourceRef(
  sourceType: 'youtube' | 'url',
  sourceRef: string,
): { ok: true; ref: string } | { ok: false; message: string } {
  const trimmed = sourceRef.trim();
  if (sourceType === 'youtube') {
    const ytId = extractYouTubeId(trimmed);
    if (!ytId) {
      return { ok: false, message: 'Link hoặc ID video YouTube không hợp lệ.' };
    }
    return { ok: true, ref: ytId };
  }
  if (!isValidHttpUrl(trimmed)) {
    return { ok: false, message: 'URL video trực tiếp không hợp lệ.' };
  }
  return { ok: true, ref: trimmed };
}

/**
 * Fetch the room row and verify the caller is its host. Returns either the
 * selected room columns or a ready-to-return failure. `columns` defaults to
 * `host_id` (the minimum needed for the ownership check).
 *
 * The host boundary is also enforced by RLS — this is defense-in-depth so we
 * can return friendly Vietnamese error messages before hitting the DB write.
 */
export async function assertHostOwnership<T extends string = 'host_id'>(
  supabase: SupabaseClient<Database>,
  roomId: string,
  userId: string,
  columns: readonly T[] = ['host_id' as T],
): Promise<{ ok: true; room: Record<T, unknown> } | { ok: false; message: string }> {
  const { data: room, error } = await supabase
    .from('watch_rooms')
    .select(columns.join(','))
    .eq('id', roomId)
    .maybeSingle();

  if (error || !room) {
    return { ok: false, message: 'Phòng không tồn tại.' };
  }

  const row = room as unknown as Record<T, unknown>;
  if ((row['host_id' as T] as unknown as string) !== userId) {
    return { ok: false, message: 'Chỉ quản phòng (host) mới có quyền thực hiện thao tác này.' };
  }

  return { ok: true, room: row };
}

/** Best-effort bump of `last_active_at` so the room sorts as recently used. */
export async function touchRoomActivity(
  supabase: SupabaseClient<Database>,
  roomId: string,
): Promise<void> {
  await supabase
    .from('watch_rooms')
    .update({ last_active_at: new Date().toISOString() })
    .eq('id', roomId);
}

/**
 * Bundle the "auth + supabase + host boundary + active queue item" prelude
 * shared by every host-only queue mutation (`advanceQueue`, `playQueueItem`,
 * …). Eliminates the identical `requireUser` + `createSupabaseServerClient` +
 * `assertHostOwnership(..., ['host_id', 'current_queue_item_id'])` + failure
 * + extract block the two callers had, which fallow's `--format compact`
 * dupes pass flags as `dup:41643f7f`.
 *
 * Returns either the bound trio + the active queue item id, or a ready-to-
 * return Vietnamese error message so callers can early-return in one line.
 */
export async function loadHostQueueContext(roomId: string): Promise<
  | {
      ok: true;
      user: { id: string };
      supabase: SupabaseClient<Database>;
      currentQueueItemId: string | null;
    }
  | { ok: false; message: string }
> {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();
  const ownership = await assertHostOwnership(supabase, roomId, user.id, [
    'host_id',
    'current_queue_item_id',
  ] as const);
  if (!ownership.ok) return ownership;
  return {
    ok: true,
    user: { id: user.id },
    supabase,
    currentQueueItemId: ownership.room.current_queue_item_id as string | null,
  };
}
