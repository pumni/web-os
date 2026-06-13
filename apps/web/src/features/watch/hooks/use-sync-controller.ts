"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import type { MediaPlayerInstance } from "@vidstack/react";
import { createSupabaseBrowserClient } from "@pumni/supabase/browser";
import type { PlaybackAnchor, Room } from "../types";
import { calculateExpectedPosition } from "../sync-math";

export function useSyncController(
  playerRef: React.RefObject<MediaPlayerInstance | null>,
  room: Room,
  isHost: boolean,
  serverClock: () => number,
  broadcastAnchor: (anchor: PlaybackAnchor) => void
) {
  const [syncStatus, setSyncStatus] = useState<"host" | "in-sync" | "catching-up">(
    isHost ? "host" : "in-sync"
  );
  
  const anchorRef = useRef<PlaybackAnchor>({
    isPlaying: room.is_playing,
    anchorPosition: room.anchor_position,
    anchorServerTs: new Date(room.anchor_server_ts).getTime(),
    playbackRate: room.playback_rate,
  });

  const suppressSeekedEventRef = useRef<boolean>(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync anchorRef when room prop updates from server
  useEffect(() => {
    anchorRef.current = {
      isPlaying: room.is_playing,
      anchorPosition: room.anchor_position,
      anchorServerTs: new Date(room.anchor_server_ts).getTime(),
      playbackRate: room.playback_rate,
    };
  }, [room.is_playing, room.anchor_position, room.anchor_server_ts, room.playback_rate]);

  // Cleanup DB update debounce timer
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // Persist playback state to database
  const persistAnchor = useCallback((anchor: PlaybackAnchor) => {
    if (!isHost) return;
    const supabase = createSupabaseBrowserClient();
    supabase
      .from("watch_rooms")
      .update({
        is_playing: anchor.isPlaying,
        anchor_position: anchor.anchorPosition,
        anchor_server_ts: new Date(anchor.anchorServerTs).toISOString(),
        playback_rate: anchor.playbackRate,
        updated_at: new Date().toISOString(),
      })
      .eq("id", room.id)
      .then(({ error }) => {
        if (error) {
          console.error("Failed to update watch room database anchor", error);
        }
      });
  }, [room.id, isHost]);

  // Debounced database updates to avoid overloading the DB
  const debouncedPersist = useCallback((anchor: PlaybackAnchor) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      persistAnchor(anchor);
    }, 2000);
  }, [persistAnchor]);

  // Host broadcasts playback status and triggers DB sync
  const emitAnchor = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;

    const newAnchor: PlaybackAnchor = {
      isPlaying: !player.paused,
      anchorPosition: player.currentTime,
      anchorServerTs: serverClock(),
      playbackRate: player.playbackRate,
    };

    anchorRef.current = newAnchor;
    broadcastAnchor(newAnchor);
    debouncedPersist(newAnchor);
  }, [playerRef, broadcastAnchor, serverClock, debouncedPersist]);

  // Follower drift reconciliation loop
  const reconcile = useCallback(() => {
    const player = playerRef.current;
    if (!player || isHost) return;

    const anchor = anchorRef.current;
    const now = serverClock();

    // Calculate the expected position of the playback head using pure helper
    const expected = calculateExpectedPosition(anchor, now);

    // 1) Match play/pause state
    if (anchor.isPlaying && player.paused) {
      player.play().catch(() => {});
    } else if (!anchor.isPlaying && !player.paused) {
      player.pause().catch(() => {});
    }

    // 2) Match position according to drift tolerance thresholds
    const current = player.currentTime;
    const drift = expected - current;
    const absDrift = Math.abs(drift);

    const isYouTube = room.source_type === "youtube";
    const DEADBAND = isYouTube ? 1.0 : 0.3;
    const HARD_SEEK = isYouTube ? 2.0 : 1.5;
    const NUDGE = isYouTube ? 0.07 : 0.05;

    if (absDrift < DEADBAND) {
      if (player.playbackRate !== anchor.playbackRate) {
        player.playbackRate = anchor.playbackRate;
      }
      setSyncStatus("in-sync");
    } else if (absDrift < HARD_SEEK) {
      // Smoothly nudge the speed to catch up or wait
      const adjustedRate = anchor.playbackRate + Math.sign(drift) * NUDGE;
      player.playbackRate = Math.max(0.5, Math.min(2.0, adjustedRate));
      setSyncStatus("catching-up");
    } else {
      // Hard jump to the expected position
      suppressSeekedEventRef.current = true;
      player.currentTime = expected;
      player.playbackRate = anchor.playbackRate;
      setSyncStatus("catching-up");
    }
  }, [playerRef, isHost, serverClock, room.source_type]);

  // Handle incoming broadcast updates
  const handleReceiveAnchor = useCallback((newAnchor: PlaybackAnchor) => {
    anchorRef.current = newAnchor;
    if (!isHost) {
      reconcile();
    }
  }, [isHost, reconcile]);

  // Periodically check sync for followers
  useEffect(() => {
    if (isHost) return;

    const interval = setInterval(() => {
      reconcile();
    }, 1000);

    return () => clearInterval(interval);
  }, [isHost, reconcile]);

  // Host event handlers to bind to the player
  const handlePlay = useCallback(() => {
    if (isHost) emitAnchor();
  }, [isHost, emitAnchor]);

  const handlePause = useCallback(() => {
    if (isHost) emitAnchor();
  }, [isHost, emitAnchor]);

  const handleRateChange = useCallback(() => {
    if (isHost) emitAnchor();
  }, [isHost, emitAnchor]);

  const handleSeeked = useCallback(() => {
    if (suppressSeekedEventRef.current) {
      suppressSeekedEventRef.current = false;
      return;
    }
    if (isHost) emitAnchor();
  }, [isHost, emitAnchor]);

  return {
    syncStatus,
    handleReceiveAnchor,
    playerHandlers: {
      onPlay: handlePlay,
      onPause: handlePause,
      onRateChange: handleRateChange,
      onSeeked: handleSeeked,
    },
  };
}
