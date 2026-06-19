'use client';

import { useEffect, useRef, type MutableRefObject, type RefObject } from 'react';
import type { MediaPlayerInstance } from '@vidstack/react';
import { createSupabaseBrowserClient } from '@pumni/supabase/browser';
import type { PlaybackAnchor } from '../types';

interface UseHostAnchorEmitterOptions {
  anchorRef: MutableRefObject<PlaybackAnchor>;
  playerRef: RefObject<MediaPlayerInstance | null>;
  roomId: string;
  isHost: boolean;
  serverClock: () => number;
}

export function useHostAnchorEmitter({
  anchorRef,
  playerRef,
  roomId,
  isHost,
  serverClock,
}: UseHostAnchorEmitterOptions) {
  const sequenceRef = useRef(0);
  const sessionIdRef = useRef<string | null>(null);

  const getHostSessionId = () => {
    if (!sessionIdRef.current) {
      sessionIdRef.current =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random()}`;
    }
    return sessionIdRef.current;
  };

  const persistAnchor = (anchor: PlaybackAnchor) => {
    if (!isHost) return;
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
          console.error('Failed to update watch room database anchor', error);
        }
      });
  };

  const persistAnchorRef = useRef(persistAnchor);
  useEffect(() => {
    persistAnchorRef.current = persistAnchor;
  });

  const emitAnchor = (options?: { overridePlaying?: boolean }) => {
    const player = playerRef.current;
    if (!player) return;

    const isPlaying = options?.overridePlaying ?? !player.paused;

    const nextAnchor: PlaybackAnchor = {
      isPlaying,
      anchorPosition: player.currentTime,
      anchorServerTs: serverClock(),
      playbackRate: player.playbackRate,
      sequence: ++sequenceRef.current,
      originSessionId: getHostSessionId(),
    };

    anchorRef.current = nextAnchor;
    persistAnchorRef.current(nextAnchor);
  };

  return emitAnchor;
}
