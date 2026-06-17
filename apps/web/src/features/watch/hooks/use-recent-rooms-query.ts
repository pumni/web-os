'use client';

import { useQuery } from '@tanstack/react-query';
import { createSupabaseBrowserClient } from '@pumni/supabase/browser';
import { watchKeys } from '../query-keys';
import type { Room } from '../types';

export function useRecentRoomsQuery(initialData: Room[]) {
  return useQuery({
    queryKey: watchKeys.recentRooms(),
    queryFn: async () => {
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
    },
    initialData,
    staleTime: 30_000,
  });
}
