import { createSupabaseBrowserClient } from '@pumni/supabase/browser';
import type { Room, QueueItem } from './types';
import { QUEUE_ITEM_SELECT } from './types';

export interface MemberProfile {
  id: string;
  username: string | null;
  avatar_url: string | null;
}

export async function getRoomClient(roomId: string, initialData: Room): Promise<Room> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('watch_rooms')
    .select(
      'id, code, host_id, source_type, source_ref, is_playing, anchor_position, anchor_server_ts, playback_rate, created_at, updated_at, current_queue_item_id, last_active_at, host_heartbeat_at',
    )
    .eq('id', roomId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data ?? initialData) as Room;
}

export async function getRecentRoomsClient(): Promise<Room[]> {
  const supabase = createSupabaseBrowserClient();

  // Get user's room memberships (RLS ensures they only see their own)
  const { data: memberships, error: membershipError } = await supabase
    .from('room_members')
    .select('room_id');

  if (membershipError) throw membershipError;

  const roomIds = memberships?.map((m) => m.room_id) || [];
  if (roomIds.length === 0) return [];

  // Fetch watch_rooms for those IDs (RLS allows members to read)
  const { data, error } = await supabase
    .from('watch_rooms')
    .select(
      'id, code, host_id, source_type, source_ref, is_playing, anchor_position, anchor_server_ts, playback_rate, created_at, updated_at, current_queue_item_id, last_active_at, host_heartbeat_at',
    )
    .in('id', roomIds)
    .order('last_active_at', { ascending: false })
    .limit(5);

  if (error) throw error;
  return (data as Room[]) || [];
}

export async function getMemberProfilesClient(
  sortedUserIds: string[],
): Promise<Record<string, MemberProfile>> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase.rpc('get_public_profiles', {
    p_ids: sortedUserIds,
  });

  if (error) throw error;

  const map: Record<string, MemberProfile> = {};
  for (const p of (data ?? []) as MemberProfile[]) {
    map[p.id] = p;
  }
  return map;
}

export async function getQueueClient(roomId: string): Promise<QueueItem[]> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('watch_queue_items')
    .select(QUEUE_ITEM_SELECT)
    .eq('room_id', roomId)
    .order('position', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    throw error;
  }

  return (data || []) as QueueItem[];
}

export async function updateHostHeartbeatClient(roomId: string, userId: string): Promise<void> {
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase
    .from('watch_room_heartbeats')
    .upsert(
      { room_id: roomId, host_id: userId, heartbeat_at: new Date().toISOString() },
      { onConflict: 'room_id' },
    );

  if (error) throw error;
}

export async function persistHostAnchorClient(
  roomId: string,
  anchor: {
    isPlaying: boolean;
    anchorPosition: number;
    anchorServerTs: number;
    playbackRate: number;
  },
): Promise<void> {
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase
    .from('watch_rooms')
    .update({
      is_playing: anchor.isPlaying,
      anchor_position: anchor.anchorPosition,
      anchor_server_ts: new Date(anchor.anchorServerTs).toISOString(),
      playback_rate: anchor.playbackRate,
      last_active_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', roomId);

  if (error) throw error;
}
