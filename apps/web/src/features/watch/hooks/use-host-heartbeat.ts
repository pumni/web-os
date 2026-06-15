'use client';

import { useEffect } from 'react';
import { createSupabaseBrowserClient } from '@pumni/supabase/browser';

// Host-only liveness heartbeat. Lets `claim_room_host` detect a dropped host.
// Updates only `host_heartbeat_at` → structural signature unchanged → no
// invalidate storm on followers.
export function useHostHeartbeat(roomId: string, isHost: boolean) {
  useEffect(() => {
    if (!isHost) return;
    const supabase = createSupabaseBrowserClient();
    const beat = () => {
      void supabase
        .from('watch_rooms')
        .update({ host_heartbeat_at: new Date().toISOString() })
        .eq('id', roomId);
    };
    beat();
    const interval = setInterval(beat, 20_000);
    return () => clearInterval(interval);
  }, [roomId, isHost]);
}
