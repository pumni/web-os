'use client';

import { useEffect, useRef, type MutableRefObject, type RefObject } from 'react';
import type { MediaPlayerInstance } from '@vidstack/react';
import { createSupabaseBrowserClient } from '@pumni/supabase/browser';
import type { PlaybackAnchor } from '../types';

const HOST_ANCHOR_COALESCE_MS = 120;

type EmitAnchorOptions = {
  flush?: boolean;
};

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
  const pendingEmitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingAnchorRef = useRef<PlaybackAnchor | null>(null);
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

  const sendAnchor = (anchor: PlaybackAnchor) => {
    anchorRef.current = anchor;
    persistAnchorRef.current(anchor);
  };

  const flushPendingAnchor = () => {
    if (pendingEmitTimerRef.current) {
      clearTimeout(pendingEmitTimerRef.current);
      pendingEmitTimerRef.current = null;
    }

    const pending = pendingAnchorRef.current;
    if (!pending) return;

    pendingAnchorRef.current = null;
    sendAnchor(pending);
  };

  const emitAnchor = (options?: EmitAnchorOptions) => {
    const player = playerRef.current;
    if (!player) return;

    const nextAnchor: PlaybackAnchor = {
      isPlaying: !player.paused,
      anchorPosition: player.currentTime,
      anchorServerTs: serverClock(),
      playbackRate: player.playbackRate,
      sequence: ++sequenceRef.current,
      originSessionId: getHostSessionId(),
    };

    anchorRef.current = nextAnchor;
    pendingAnchorRef.current = nextAnchor;

    if (options?.flush) {
      flushPendingAnchor();
      return;
    }

    if (pendingEmitTimerRef.current) clearTimeout(pendingEmitTimerRef.current);
    pendingEmitTimerRef.current = setTimeout(() => {
      flushPendingAnchor();
    }, HOST_ANCHOR_COALESCE_MS);
  };

  useEffect(() => {
    return () => {
      if (pendingEmitTimerRef.current) clearTimeout(pendingEmitTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!isHost) return;
    const flushForPageExit = () => {
      if (pendingEmitTimerRef.current) clearTimeout(pendingEmitTimerRef.current);
      pendingEmitTimerRef.current = null;
      pendingAnchorRef.current = null;
      persistAnchorRef.current(anchorRef.current);
    };
    window.addEventListener('pagehide', flushForPageExit);
    return () => window.removeEventListener('pagehide', flushForPageExit);
  }, [anchorRef, isHost]);

  return emitAnchor;
}
