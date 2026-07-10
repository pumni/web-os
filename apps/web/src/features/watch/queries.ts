import 'server-only';

import { requireUser } from '@pumni/auth';
import { createSupabaseServerClient } from '@pumni/supabase/server';
import { createSupabaseServiceRoleClient } from '@pumni/supabase/service-role';
import { type Room, type QueueItem, QUEUE_ITEM_SELECT } from './types';
import { cacheLife, cacheTag } from 'next/cache';

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
    .from('room_members')
    .insert({ room_id: roomId, user_id: user.id });
  if (error && error.code !== '23505') {
    console.error('Failed to ensure room membership:', error.message);
    throw new Error(error.message);
  }
}

/** Reads a single watch room from database for initial server-side render. */
export async function getRoom(roomId: string): Promise<Room | null> {
  await requireUser();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('watch_rooms')
    .select(
      'id, code, host_id, source_type, source_ref, is_playing, anchor_position, anchor_server_ts, playback_rate, created_at, updated_at, current_queue_item_id, last_active_at, host_heartbeat_at',
    )
    .eq('id', roomId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching watch room:', error);
    return null;
  }
  return data;
}

/** Reads all watch queue items for a room, ordered by position. */
export async function getQueue(roomId: string): Promise<QueueItem[]> {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  // Validate room membership outside "use cache" using user client (respects RLS)
  const { data: membership, error: membershipError } = await supabase
    .from('room_members')
    .select('room_id')
    .eq('room_id', roomId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (membershipError) {
    console.error('Database error checking room membership:', membershipError.message);
    return [];
  }

  if (!membership) {
    // Expected on initial load before useRoomMembership registers the caller
    return [];
  }

  return getCachedQueue(roomId);
}

async function getCachedQueue(roomId: string): Promise<QueueItem[]> {
  'use cache';
  cacheTag(`room_queue:${roomId}`);
  cacheLife('minutes');

  const supabase = createSupabaseServiceRoleClient();

  // fallow-ignore-next-line code-duplication -- Intentional: this Supabase select/order block intentionally mirrors the room query but belongs to a separate cache-tagged path; sharing a helper would couple two independently cached reads
  const { data, error } = await supabase
    .from('watch_queue_items')
    .select(QUEUE_ITEM_SELECT)
    .eq('room_id', roomId)
    .order('position', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching watch queue:', error);
    return [];
  }
  return data || [];
}

/** Fetches the user's recent watch rooms, ordered by last activity. */
export async function getRecentRooms(userId: string, limit = 5): Promise<Room[]> {
  'use cache';
  cacheTag(`recent_rooms:${userId}`);
  // Fallback TTL only — every room create/join/leave/host-change action
  // updateTag()s this key, so a longer profile just trims idle refetches.
  cacheLife('hours');

  const supabase = createSupabaseServiceRoleClient();

  // Step 1: Get room IDs the user is a member of
  const { data: memberships, error: membershipError } = await supabase
    .from('room_members')
    .select('room_id')
    .eq('user_id', userId);

  if (membershipError) {
    console.error('Error fetching room memberships:', membershipError);
    throw new Error(membershipError.message);
  }

  const roomIds = memberships.map((m) => m.room_id);
  if (roomIds.length === 0) {
    return [];
  }

  // Step 2: Fetch watch_rooms for those IDs
  const { data, error } = await supabase
    .from('watch_rooms')
    .select(
      'id, code, host_id, source_type, source_ref, is_playing, anchor_position, anchor_server_ts, playback_rate, created_at, updated_at, current_queue_item_id, last_active_at, host_heartbeat_at',
    )
    .in('id', roomIds)
    .order('last_active_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching recent rooms:', error);
    throw new Error(error.message);
  }

  return data || [];
}
