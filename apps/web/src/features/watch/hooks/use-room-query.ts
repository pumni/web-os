'use client';

import { useQuery } from '@tanstack/react-query';
import { createSupabaseBrowserClient } from '@pumni/supabase/browser';
import { watchKeys } from '../query-keys';
import type { Room } from '../types';

export function useRoomQuery(roomId: string, initialData: Room) {
  return useQuery({
    queryKey: watchKeys.room(roomId),
    queryFn: async () => {
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

      // Room may have been deleted by host mid-session: keep last known data
      // instead of throwing a hard error.
      return (data ?? initialData) as Room;
    },
    initialData,
    staleTime: 30_000,
  });
}
