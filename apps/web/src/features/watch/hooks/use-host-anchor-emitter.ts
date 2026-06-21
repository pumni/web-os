'use client';

import { useEffect, useRef, type MutableRefObject, type RefObject } from 'react';
import type { MediaPlayerInstance } from '@vidstack/react';
import { createSupabaseBrowserClient } from '@pumni/supabase/browser';
import { useTelemetryRef } from '@/shared/lib/observability';

import type { PlaybackAnchor } from '../types';

interface UseHostAnchorEmitterOptions {
  anchorRef: MutableRefObject<PlaybackAnchor>;
  playerRef: RefObject<MediaPlayerInstance | null>;
  roomId: string;
  isHost: boolean;
  serverClock: () => number;
  /**
   * Low-latency fan-out for the versioned anchor (ADR-0011). Sent on every emit
   * in parallel with the debounced DB persist, so followers react in tens of ms
   * instead of waiting for the DB → postgres_changes round-trip.
   */
  broadcastAnchor?: (anchor: PlaybackAnchor) => void;
}

export function useHostAnchorEmitter({
  anchorRef,
  playerRef,
  roomId,
  isHost,
  serverClock,
  broadcastAnchor,
}: UseHostAnchorEmitterOptions) {
  const sequenceRef = useRef(0);
  const sessionIdRef = useRef<string | null>(null);
  const pendingAnchorRef = useRef<PlaybackAnchor | null>(null);
  const persistTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const telemetryRef = useTelemetryRef();

  const getHostSessionId = () => {
    if (!sessionIdRef.current) {
      sessionIdRef.current =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random()}`;
    }
    return sessionIdRef.current;
  };

  const persistAnchor = (anchor: PlaybackAnchor, force = false) => {
    if (!isHost && !force) return;
    const supabase = createSupabaseBrowserClient();
    supabase
      .from('watch_rooms')
      .update({
        is_playing: anchor.isPlaying,
        anchor_position: anchor.anchorPosition,
        anchor_server_ts: new Date(anchor.anchorServerTs).toISOString(),
        playback_rate: anchor.playbackRate,
        last_active_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', roomId)
      .then(({ error }) => {
        if (error) {
          telemetryRef.current.error(error, { scope: 'host-anchor-persist', roomId });
        }
      });
  };

  const persistAnchorRef = useRef(persistAnchor);
  useEffect(() => {
    persistAnchorRef.current = persistAnchor;
  });

  const flushPersist = (force = false) => {
    if (persistTimerRef.current) {
      clearTimeout(persistTimerRef.current);
      persistTimerRef.current = null;
    }
    const pending = pendingAnchorRef.current;
    pendingAnchorRef.current = null;
    if (pending) {
      persistAnchorRef.current(pending, force);
    }
  };

  const schedulePersist = (anchor: PlaybackAnchor) => {
    pendingAnchorRef.current = anchor;
    if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
    persistTimerRef.current = setTimeout(() => flushPersist(), 250);
  };

  // Flush on unmount to save any final pending state
  useEffect(() => {
    return () => {
      if (persistTimerRef.current) {
        clearTimeout(persistTimerRef.current);
        persistTimerRef.current = null;
      }
      const pending = pendingAnchorRef.current;
      if (pending) {
        persistAnchorRef.current(pending, true);
      }
      pendingAnchorRef.current = null;
    };
  }, []);

  // Flush when isHost flips false so the last anchor lands
  const prevIsHostRef = useRef(isHost);
  useEffect(() => {
    if (prevIsHostRef.current && !isHost) {
      flushPersist(true);
    }
    prevIsHostRef.current = isHost;
  }, [isHost]);

  const emitAnchor = (options?: { overridePlaying?: boolean }) => {
    const player = playerRef.current;
    if (!player) return;

    const isPlaying = options?.overridePlaying ?? !player.paused;
    const prevAnchor = anchorRef.current;

    const nextAnchor: PlaybackAnchor = {
      isPlaying,
      anchorPosition: player.currentTime,
      anchorServerTs: serverClock(),
      playbackRate: player.playbackRate,
      sequence: ++sequenceRef.current,
      originSessionId: getHostSessionId(),
    };

    anchorRef.current = nextAnchor;

    // Fast path: fan the versioned anchor out over realtime immediately.
    // Followers dedupe against the slower persisted snapshot by sequence.
    if (isHost) broadcastAnchor?.(nextAnchor);

    const isTransportEdge =
      options?.overridePlaying !== undefined || nextAnchor.isPlaying !== prevAnchor.isPlaying;

    if (isTransportEdge) {
      flushPersist(); // Clear any pending timers and flush previous anchor if any
      persistAnchorRef.current(nextAnchor);
    } else {
      schedulePersist(nextAnchor);
    }
  };

  return emitAnchor;
}
