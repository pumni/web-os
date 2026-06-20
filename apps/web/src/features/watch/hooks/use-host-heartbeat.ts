'use client';

import { useEffect } from 'react';
import { createSupabaseBrowserClient } from '@pumni/supabase/browser';

// Host-only liveness heartbeat. Lets `claim_room_host` detect a dropped host.
// Writes to the dedicated `watch_room_heartbeats` table (which is NOT realtime-published)
// to prevent broadcast noise every 20s.
export function useHostHeartbeat(roomId: string, userId: string, isHost: boolean) {
  useEffect(() => {
    if (!isHost) return;
    const supabase = createSupabaseBrowserClient();
    const beat = () => {
      void supabase
        .from('watch_room_heartbeats')
        .upsert(
          { room_id: roomId, host_id: userId, heartbeat_at: new Date().toISOString() },
          { onConflict: 'room_id' },
        );
    };
    beat();
    const interval = setInterval(beat, 20_000);
    return () => clearInterval(interval);
  }, [roomId, userId, isHost]);
}
