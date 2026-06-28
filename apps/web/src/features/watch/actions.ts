'use server';

import { requireUser } from '@pumni/auth';
import { createSupabaseServerClient } from '@pumni/supabase/server';
import {
  createRoomSchema,
  setSourceSchema,
  addQueueItemSchema,
  reorderQueueSchema,
  transferHostSchema,
  type CreateRoomInput,
  type SetSourceInput,
  type AddQueueItemInput,
  type ReorderQueueInput,
  type TransferHostInput,
} from '@pumni/validators';
import { randomBytes } from 'crypto';
import { fractionalPosition } from './sync-math';
import { updateTag } from 'next/cache';
import {
  sanitizeSourceRef,
  assertHostOwnership,
  touchRoomActivity,
  type ActionResult,
} from './action-helpers';

function generateJoinCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const bytes = randomBytes(6);
  let code = '';
  for (let i = 0; i < 6; i++) {
    const val = bytes[i];
    if (val !== undefined) {
      code += chars[val % chars.length];
    }
  }
  return code;
}

/**
 * Apply the canonical "switch the room's playback source" update to
 * `watch_rooms`. Centralises the 9-field stalled-reset block earlier
 * duplicated between `setRoomSource`, `advanceQueue`, and `playQueueItem`.
 * Returns the underlying Supabase error message (or `null` on success) so
 * each caller can return its own `ActionResult` shape.
 */
async function startPlayingItem(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  roomId: string,
  source: { source_type: 'youtube' | 'url'; source_ref: string },
  currentQueueItemId: string | null,
): Promise<{ error: string | null }> {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from('watch_rooms')
    .update({
      source_type: source.source_type,
      source_ref: source.source_ref,
      is_playing: false,
      anchor_position: 0,
      playback_rate: 1,
      anchor_server_ts: now,
      current_queue_item_id: currentQueueItemId,
      last_active_at: now,
      updated_at: now,
    })
    .eq('id', roomId);
  return { error: error ? error.message : null };
}

/**
 * Validate an action input against its Zod schema and return either the typed
 * input or an {@link ActionResult} failure that the caller can return
 * directly. Removes the repeated `safeParse`/`early-return` block from every
 * validator-driven action.
 */
function parseActionInput<T>(
  schema: { safeParse: (input: unknown) => { success: true; data: T } | { success: false } },
  input: unknown,
  errorMessage: string,
): { ok: true; data: T } | { ok: false; message: string } {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: errorMessage };
  }
  return { ok: true, data: parsed.data };
}

/** Invalidate the cache tags that every successful watch-room action
 *  bumps: the per-room queue tag and the user's recent-rooms tag. */
function bumpWatchTags(roomId: string, userId: string): void {
  updateTag(`room_queue:${roomId}`);
  updateTag(`recent_rooms:${userId}`);
}

async function finalizeRoomQueueAction(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  roomId: string,
  userId: string,
): Promise<{ ok: true; data: undefined }> {
  await touchRoomActivity(supabase, roomId);
  bumpWatchTags(roomId, userId);
  return { ok: true, data: undefined };
}

/**
 * Best-effort auto-title when the user leaves the title blank. YouTube uses the
 * public oEmbed endpoint (no API key); direct URLs fall back to the file name.
 * Never throws — returns null on any failure so adding still succeeds.
 */
async function fetchVideoTitle(sourceType: 'youtube' | 'url', ref: string): Promise<string | null> {
  try {
    if (sourceType === 'youtube') {
      const res = await fetch(
        `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${ref}&format=json`,
        { signal: AbortSignal.timeout(5000) },
      );
      if (res.ok) {
        const data = (await res.json()) as { title?: string };
        const t = data.title?.trim();
        return t ? t.slice(0, 300) : null;
      }
    } else {
      const u = new URL(ref);
      const last = u.pathname.split('/').filter(Boolean).pop();
      if (last) return decodeURIComponent(last).slice(0, 300);
    }
  } catch {
    // ignore — auto-title is best-effort
  }
  return null;
}

export async function createRoom(
  input: CreateRoomInput,
): Promise<ActionResult<{ roomId: string; code: string }>> {
  const user = await requireUser();
  const parsed = parseActionInput(
    createRoomSchema,
    input,
    'Dữ liệu tạo phòng không hợp lệ.',
  );
  if (!parsed.ok) return parsed;

  const sanitized = sanitizeSourceRef(parsed.data.sourceType, parsed.data.sourceRef);
  if (!sanitized.ok) return sanitized;

  const supabase = await createSupabaseServerClient();

  // Retry logic for generating unique code
  let attempts = 0;
  while (attempts < 3) {
    const code = generateJoinCode();
    const { data, error } = await supabase
      .from('watch_rooms')
      .insert({
        code,
        host_id: user.id,
        source_type: parsed.data.sourceType,
        source_ref: sanitized.ref,
        is_playing: false,
        anchor_position: 0,
        playback_rate: 1,
        anchor_server_ts: new Date().toISOString(),
        last_active_at: new Date().toISOString(),
      })
      .select('id, code')
      .maybeSingle();

    if (!error && data) {
      // Add host as the first member of the room
      await supabase.from('room_members').insert({
        room_id: data.id,
        user_id: user.id,
      });

      updateTag(`recent_rooms:${user.id}`);
      return { ok: true, data: { roomId: data.id, code: data.code } };
    }

    if (error && error.code !== '23505') {
      // 23505 is unique violation code in Postgres
      return { ok: false, message: error.message };
    }

    attempts++;
  }

  return { ok: false, message: 'Không thể khởi tạo mã phòng độc nhất. Vui lòng thử lại.' };
}

export async function setRoomSource(input: SetSourceInput): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = parseActionInput(
    setSourceSchema,
    input,
    'Dữ liệu nguồn phát không hợp lệ.',
  );
  if (!parsed.ok) return parsed;

  const sanitized = sanitizeSourceRef(parsed.data.sourceType, parsed.data.sourceRef);
  if (!sanitized.ok) return sanitized;

  const supabase = await createSupabaseServerClient();

  // Enforce host boundary (also verified by RLS)
  const ownership = await assertHostOwnership(supabase, parsed.data.roomId, user.id);
  if (!ownership.ok) return ownership;

  const { error } = await startPlayingItem(
    supabase,
    parsed.data.roomId,
    { source_type: parsed.data.sourceType, source_ref: sanitized.ref },
    null,
  );

  if (error) {
    return { ok: false, message: error };
  }

  updateTag(`recent_rooms:${user.id}`);
  return { ok: true, data: undefined };
}

export async function joinByCode(code: string): Promise<ActionResult<{ roomId: string }>> {
  await requireUser();
  const supabase = await createSupabaseServerClient();
  const cleanCode = code.trim().toUpperCase();

  const { data, error } = await supabase
    .from('watch_rooms')
    .select('id')
    .eq('code', cleanCode)
    .maybeSingle();

  if (error) {
    return { ok: false, message: error.message };
  }

  if (!data) {
    return { ok: false, message: 'Mã phòng không tồn tại. Vui lòng kiểm tra lại.' };
  }

  return { ok: true, data: { roomId: data.id } };
}

/** Call leave_room RPC to delete membership and cleanup empty room. */
export async function leaveRoom(roomId: string): Promise<ActionResult> {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.rpc('leave_room', {
    p_room_id: roomId,
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  updateTag(`recent_rooms:${user.id}`);
  return { ok: true, data: undefined };
}

/** Add a new item to the collaborative queue. */
export async function addQueueItem(input: AddQueueItemInput): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = parseActionInput(
    addQueueItemSchema,
    input,
    'Dữ liệu hàng chờ không hợp lệ.',
  );
  if (!parsed.ok) return parsed;

  const sanitized = sanitizeSourceRef(parsed.data.sourceType, parsed.data.sourceRef);
  if (!sanitized.ok) return sanitized;

  const supabase = await createSupabaseServerClient();

  // Find max position currently in queue
  const { data: maxItem, error: maxError } = await supabase
    .from('watch_queue_items')
    .select('position')
    .eq('room_id', parsed.data.roomId)
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (maxError) {
    return { ok: false, message: maxError.message };
  }

  const newPosition = maxItem ? fractionalPosition(maxItem.position, null) : 0.0;

  // Auto-derive a title when the user left it blank.
  const finalTitle =
    parsed.data.title?.trim() ||
    (await fetchVideoTitle(parsed.data.sourceType, sanitized.ref)) ||
    null;

  const { error: insertError } = await supabase.from('watch_queue_items').insert({
    room_id: parsed.data.roomId,
    position: newPosition,
    source_type: parsed.data.sourceType,
    source_ref: sanitized.ref,
    title: finalTitle,
    added_by: user.id,
  });

  if (insertError) {
    return { ok: false, message: insertError.message };
  }

  updateTag(`room_queue:${parsed.data.roomId}`);
  return finalizeRoomQueueAction(supabase, parsed.data.roomId, user.id);
}

/** Reorder an item in the queue using fractional indexing. */
export async function reorderQueue(input: ReorderQueueInput): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = parseActionInput(
    reorderQueueSchema,
    input,
    'Dữ liệu vị trí không hợp lệ.',
  );
  if (!parsed.ok) return parsed;

  const supabase = await createSupabaseServerClient();

  let beforePosition: number | null = null;
  let afterPosition: number | null = null;

  const beforePromise = parsed.data.beforeId
    ? supabase
        .from('watch_queue_items')
        .select('position')
        .eq('id', parsed.data.beforeId)
        .maybeSingle()
    : Promise.resolve({ data: null, error: null });

  const afterPromise = parsed.data.afterId
    ? supabase
        .from('watch_queue_items')
        .select('position')
        .eq('id', parsed.data.afterId)
        .maybeSingle()
    : Promise.resolve({ data: null, error: null });

  const [beforeResult, afterResult] = await Promise.all([beforePromise, afterPromise]);

  if (parsed.data.beforeId) {
    if (beforeResult.error || !beforeResult.data) {
      return { ok: false, message: 'Không tìm thấy item đứng trước.' };
    }
    beforePosition = beforeResult.data.position;
  }

  if (parsed.data.afterId) {
    if (afterResult.error || !afterResult.data) {
      return { ok: false, message: 'Không tìm thấy item đứng sau.' };
    }
    afterPosition = afterResult.data.position;
  }

  const newPosition = fractionalPosition(beforePosition, afterPosition);

  const { error: updateError } = await supabase
    .from('watch_queue_items')
    .update({ position: newPosition })
    .eq('id', parsed.data.itemId)
    .eq('room_id', parsed.data.roomId);

  if (updateError) {
    return { ok: false, message: updateError.message };
  }

  updateTag(`room_queue:${parsed.data.roomId}`);
  return finalizeRoomQueueAction(supabase, parsed.data.roomId, user.id);
}

/** Remove an item from the playlist. */
export async function removeQueueItem(roomId: string, itemId: string): Promise<ActionResult> {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { error: deleteError } = await supabase
    .from('watch_queue_items')
    .delete()
    .eq('id', itemId)
    .eq('room_id', roomId);

  if (deleteError) {
    return { ok: false, message: deleteError.message };
  }

  // Postgres ON DELETE SET NULL on watch_rooms.current_queue_item_id automatically handles
  // clearing the current queue item ID reference if it was this itemId.
  // finalizeRoomQueueAction bumps room activity + cache tags so the lobby/dashboard updates.
  updateTag(`room_queue:${roomId}`);
  return finalizeRoomQueueAction(supabase, roomId, user.id);
}

/** Host-only action to advance to next item in the queue.
 *  Also removes the currently-playing item so played videos don't linger. */
export async function advanceQueue(roomId: string): Promise<ActionResult> {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  // Enforce host boundary (also verified by RLS); also read the active queue item.
  const ownership = await assertHostOwnership(supabase, roomId, user.id, [
    'host_id',
    'current_queue_item_id',
  ] as const);
  if (!ownership.ok) return ownership;
  const currentQueueItemId = ownership.room.current_queue_item_id as string | null;

  let currentPosition = -999999.0;
  if (currentQueueItemId) {
    const { data: currentItem } = await supabase
      .from('watch_queue_items')
      .select('position')
      .eq('id', currentQueueItemId)
      .maybeSingle();
    if (currentItem) {
      currentPosition = currentItem.position;
    }
  }

  // Get first item with position > currentPosition
  const { data: nextItem, error: nextError } = await supabase
    .from('watch_queue_items')
    .select('id, source_type, source_ref')
    .eq('room_id', roomId)
    .gt('position', currentPosition)
    .order('position', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (nextError) {
    return { ok: false, message: nextError.message };
  }

  if (!nextItem) {
    return { ok: false, message: 'Hàng chờ đã hết. Vui lòng thêm video mới.' };
  }

  const { error: updateError } = await startPlayingItem(
    supabase,
    roomId,
    { source_type: nextItem.source_type, source_ref: nextItem.source_ref },
    nextItem.id,
  );

  if (updateError) {
    return { ok: false, message: updateError };
  }

  // Delete the just-played item so it won't linger in the queue
  if (currentQueueItemId) {
    await supabase
      .from('watch_queue_items')
      .delete()
      .eq('id', currentQueueItemId)
      .eq('room_id', roomId);
  }

  bumpWatchTags(roomId, user.id);
  return { ok: true, data: undefined };
}

/** Host-only action to transfer host to another member. */
export async function transferHost(input: TransferHostInput): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = parseActionInput(
    transferHostSchema,
    input,
    'Dữ liệu chuyển chủ phòng không hợp lệ.',
  );
  if (!parsed.ok) return parsed;

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.rpc('transfer_room_host', {
    p_room_id: parsed.data.roomId,
    p_new_host: parsed.data.newHostId,
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  await touchRoomActivity(supabase, parsed.data.roomId);

  updateTag(`recent_rooms:${user.id}`);
  updateTag(`recent_rooms:${parsed.data.newHostId}`);
  return { ok: true, data: undefined };
}

/** Member action to claim host when the current host is gone (gated server-side). */
export async function claimHost(roomId: string): Promise<ActionResult> {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc('claim_room_host', { p_room_id: roomId });
  if (error) {
    return { ok: false, message: error.message };
  }
  updateTag(`recent_rooms:${user.id}`);
  return { ok: true, data: undefined };
}

/** Host-only action to play a specific queue item directly. */
export async function playQueueItem(roomId: string, itemId: string): Promise<ActionResult> {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  // Enforce host boundary (also verified by RLS); also read the active queue item.
  const ownership = await assertHostOwnership(supabase, roomId, user.id, [
    'host_id',
    'current_queue_item_id',
  ] as const);
  if (!ownership.ok) return ownership;
  const currentQueueItemId = ownership.room.current_queue_item_id as string | null;

  // Get the target queue item
  const { data: targetItem, error: targetError } = await supabase
    .from('watch_queue_items')
    .select('id, source_type, source_ref')
    .eq('id', itemId)
    .eq('room_id', roomId)
    .maybeSingle();

  if (targetError || !targetItem) {
    return { ok: false, message: 'Không tìm thấy bài hát trong hàng chờ.' };
  }

  // Update room to play this item
  const { error: updateError } = await startPlayingItem(
    supabase,
    roomId,
    { source_type: targetItem.source_type, source_ref: targetItem.source_ref },
    targetItem.id,
  );

  if (updateError) {
    return { ok: false, message: updateError };
  }

  // Delete the previously playing item if it is different from the target item
  if (currentQueueItemId && currentQueueItemId !== itemId) {
    await supabase
      .from('watch_queue_items')
      .delete()
      .eq('id', currentQueueItemId)
      .eq('room_id', roomId);
  }

  updateTag(`room_queue:${roomId}`);
  bumpWatchTags(roomId, user.id);
  return { ok: true, data: undefined };
}
