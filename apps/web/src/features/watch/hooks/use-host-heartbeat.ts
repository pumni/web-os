'use client';

import { useEffect } from 'react';
import { updateHostHeartbeatClient } from '../client-queries';

// Host-only liveness heartbeat. Lets `claim_room_host` detect a dropped host.
// Writes to the dedicated `watch_room_heartbeats` table (which is NOT realtime-published)
// to prevent broadcast noise every 20s.
export function useHostHeartbeat(roomId: string, userId: string, isHost: boolean) {
  useEffect(() => {
    if (!isHost) return;
    const beat = () => {
      updateHostHeartbeatClient(roomId, userId).catch((err) => {
        console.error(
          'Failed to update host heartbeat:',
          err.message || err,
          err.details || '',
          err.hint || '',
          err.code || '',
        );
      });
    };
    beat();
    const interval = setInterval(beat, 20_000);
    return () => clearInterval(interval);
  }, [roomId, userId, isHost]);
}
