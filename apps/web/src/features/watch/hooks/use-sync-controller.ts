'use client';

import { useRef, useState, useEffect } from 'react';
import type {
  MediaPlayerInstance,
  MediaPlayEvent,
  MediaPauseEvent,
  MediaSeekedEvent,
} from '@vidstack/react';
import type { PlaybackAnchor, Room, RoomRealtimeEvents } from '../types';
import {
  calculateExpectedPosition,
  shouldAcceptPersistedAnchorSnapshot,
  shouldAcceptPlaybackAnchor,
} from '../sync-math';
import { useHostAnchorEmitter } from './use-host-anchor-emitter';

// ---------------------------------------------------------------------------
// Pure helpers — no side-effects, no refs
// ---------------------------------------------------------------------------

export type DriftThresholds = {
  deadband: number;
  hardSeek: number;
  nudge: number;
};

export function getDriftThresholds(sourceType: string): DriftThresholds {
  const isYouTube = sourceType === 'youtube';
  return {
    deadband: isYouTube ? 1.0 : 0.3,
    hardSeek: isYouTube ? 2.0 : 1.5,
    nudge: isYouTube ? 0.07 : 0.05,
  };
}

export type DriftAction = 'in-sync' | 'nudge' | 'seek';

export function classifyDrift(absDrift: number, thresholds: DriftThresholds): DriftAction {
  if (absDrift < thresholds.deadband) return 'in-sync';
  if (absDrift < thresholds.hardSeek) return 'nudge';
  return 'seek';
}

export function matchTransportState(
  player: MediaPlayerInstance,
  anchor: PlaybackAnchor,
  tryPlay: (p: MediaPlayerInstance) => void,
  markProgrammatic: () => void,
) {
  if (anchor.isPlaying && player.paused) {
    tryPlay(player);
  } else if (!anchor.isPlaying && !player.paused) {
    markProgrammatic();
    player.pause().catch(() => {});
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useSyncController(
  playerRef: React.RefObject<MediaPlayerInstance | null>,
  room: Room,
  isHost: boolean,
  serverClock: () => number,
  roomEvents: Pick<RoomRealtimeEvents, 'onAnchor'>,
) {
  const [syncStatus, setSyncStatus] = useState<'host' | 'in-sync' | 'catching-up'>(
    isHost ? 'host' : 'in-sync',
  );

  // Follower sync lock states (client-side only)
  const [isFollowingHost, setIsFollowingHost] = useState<boolean>(true);
  const isFollowingHostRef = useRef<boolean>(true);

  const [prevIsHost, setPrevIsHost] = useState(isHost);
  if (isHost !== prevIsHost) {
    setPrevIsHost(isHost);
    setIsFollowingHost(true);
    setSyncStatus(isHost ? 'host' : 'in-sync');
  }

  useEffect(() => {
    isFollowingHostRef.current = true;
  }, [isHost]);

  const [needsGesture, setNeedsGesture] = useState(false);
  const needsGestureRef = useRef(false);

  const anchorRef = useRef<PlaybackAnchor>({
    isPlaying: room.is_playing,
    anchorPosition: room.anchor_position,
    anchorServerTs: new Date(room.anchor_server_ts).getTime(),
    playbackRate: room.playback_rate,
  });

  // Sync anchorRef when room prop updates from server
  useEffect(() => {
    const persistedAnchor = {
      isPlaying: room.is_playing,
      anchorPosition: room.anchor_position,
      anchorServerTs: new Date(room.anchor_server_ts).getTime(),
      playbackRate: room.playback_rate,
    };

    if (shouldAcceptPersistedAnchorSnapshot(anchorRef.current, persistedAnchor)) {
      anchorRef.current = persistedAnchor;
    }
  }, [room.is_playing, room.anchor_position, room.anchor_server_ts, room.playback_rate]);

  const emitAnchor = useHostAnchorEmitter({
    anchorRef,
    playerRef,
    roomId: room.id,
    isHost,
    serverClock,
  });

  // Programmatic window: ignore play/pause/seeked events emitted by reconcile/resync itself.
  // This is required because isOriginTrusted is unreliable on YouTube providers (synthetic
  // events from iframe API) which previously caused incorrect sync breakages when the host paused.
  const programmaticUntilRef = useRef(0);
  const PROGRAMMATIC_WINDOW_MS = 1500; // YouTube bridge async; adjust if needed
  const markProgrammatic = () => {
    programmaticUntilRef.current = Date.now() + PROGRAMMATIC_WINDOW_MS;
  };
  const isWithinProgrammaticWindow = () => Date.now() < programmaticUntilRef.current;

  // Robust play: browsers block unmuted autoplay without a user gesture.
  // Fall back to muted autoplay (always allowed); if even that fails, surface
  // a tap-to-play overlay via needsGesture.
  const tryPlay = (player: MediaPlayerInstance) => {
    markProgrammatic();
    player.play().catch(() => {
      markProgrammatic();
      player.muted = true;
      player.play().catch(() => {
        needsGestureRef.current = true;
        setNeedsGesture(true);
      });
    });
  };

  // Follower drift reconciliation loop
  const reconcile = () => {
    const player = playerRef.current;
    // Bypassed if client is not following host or if client is host
    if (!player || isHost || !isFollowingHostRef.current) return;

    const anchor = anchorRef.current;
    const now = serverClock();

    // Calculate the expected position of the playback head using pure helper
    const expected = calculateExpectedPosition(anchor, now);

    // 1) Match play/pause state
    matchTransportState(player, anchor, tryPlay, markProgrammatic);

    // 2) Match position according to drift tolerance thresholds
    const drift = expected - player.currentTime;
    const absDrift = Math.abs(drift);
    const thresholds = getDriftThresholds(room.source_type);
    const action = classifyDrift(absDrift, thresholds);

    switch (action) {
      case 'in-sync':
        if (player.playbackRate !== anchor.playbackRate) {
          player.playbackRate = anchor.playbackRate;
        }
        setSyncStatus('in-sync');
        break;
      case 'nudge': {
        const adjustedRate = anchor.playbackRate + Math.sign(drift) * thresholds.nudge;
        player.playbackRate = Math.max(0.5, Math.min(2.0, adjustedRate));
        setSyncStatus('catching-up');
        break;
      }
      case 'seek':
        if (Math.abs(player.currentTime - expected) > 0.01) {
          markProgrammatic();
          player.currentTime = expected;
        }
        player.playbackRate = anchor.playbackRate;
        setSyncStatus('catching-up');
        break;
    }
  };

  const reconcileRef = useRef(reconcile);
  useEffect(() => {
    reconcileRef.current = reconcile;
  });

  // Detect follower manual interaction
  const handleFollowerManualInteraction = () => {
    if (isHost) return;
    // Follower broke sync
    isFollowingHostRef.current = false;
    setIsFollowingHost(false);
    setSyncStatus('catching-up');
  };

  // Command to catch up with host immediately
  const resync = () => {
    isFollowingHostRef.current = true;
    setIsFollowingHost(true);

    const player = playerRef.current;
    const anchor = anchorRef.current;
    if (!player) return;

    const expected = calculateExpectedPosition(anchor, serverClock());
    if (Math.abs(player.currentTime - expected) > 0.01) {
      markProgrammatic();
      player.currentTime = expected;
    }
    player.playbackRate = anchor.playbackRate;

    matchTransportState(player, anchor, tryPlay, markProgrammatic);
  };

  // Called from the tap-to-play overlay (a real user gesture).
  const resumeFromGesture = () => {
    needsGestureRef.current = false;
    setNeedsGesture(false);
    const player = playerRef.current;
    if (player) player.muted = false;
    resync();
  };

  const receiveAnchorRef = useRef<(anchor: PlaybackAnchor) => void>(() => {});
  useEffect(() => {
    receiveAnchorRef.current = (newAnchor: PlaybackAnchor) => {
      if (!shouldAcceptPlaybackAnchor(anchorRef.current, newAnchor)) return;
      anchorRef.current = newAnchor;
      if (isHost) return;

      // Each accepted anchor is a deliberate transport command from the host;
      // re-engage following and reconcile even if the follower had manually broken sync.
      if (!isFollowingHostRef.current) {
        isFollowingHostRef.current = true;
        setIsFollowingHost(true);
      }
      reconcileRef.current();
    };
  }, [isHost]);

  useEffect(() => {
    return roomEvents.onAnchor((anchor) => receiveAnchorRef.current(anchor));
  }, [roomEvents]);

  // Periodically check sync for followers.
  // Note: We deliberately do NOT check document.hidden here to pause the loop. Gating
  // on visibility would cause audio to drift uncorrected when the user runs the video
  // in a background tab (a supported use case). Correct background audio alignment
  // is prioritized over the minor CPU overhead of a 1s timer.
  useEffect(() => {
    if (isHost) return;

    const interval = setInterval(() => {
      reconcileRef.current();
    }, 1000);

    return () => clearInterval(interval);
  }, [isHost]);

  const isFollowerManualEvent = (e?: { isOriginTrusted?: boolean }) =>
    !isWithinProgrammaticWindow() && e?.isOriginTrusted !== false;

  // Player event handlers
  const handlePlay = (e?: MediaPlayEvent) => {
    if (isHost) {
      emitAnchor();
    } else if (isFollowerManualEvent(e)) {
      handleFollowerManualInteraction();
    }
  };

  const handlePause = (e?: MediaPauseEvent) => {
    if (isHost) {
      emitAnchor();
    } else if (isFollowerManualEvent(e)) {
      handleFollowerManualInteraction();
    }
  };

  const handleRateChange = () => {
    if (isHost) emitAnchor();
  };

  const handleSeeked = (detail?: number, e?: MediaSeekedEvent) => {
    if (isHost) {
      emitAnchor();
    } else if (isFollowerManualEvent(e)) {
      handleFollowerManualInteraction();
    }
  };

  const handleControlPlayPauseIntent = () => {
    if (isHost) {
      const player = playerRef.current;
      if (player) {
        // Force the target state immediately based on host intent to enable parallel buffering/play
        const targetPlaying = player.paused;
        emitAnchor({ overridePlaying: targetPlaying });
      }
    } else {
      handleFollowerManualInteraction();
    }
  };

  const handleControlSeekCommitIntent = () => {
    if (isHost) {
      emitAnchor();
    } else {
      handleFollowerManualInteraction();
    }
  };

  return {
    syncStatus,
    isFollowingHost,
    needsGesture,
    resync,
    resumeFromGesture,
    playerHandlers: {
      onPlay: handlePlay,
      onPause: handlePause,
      onRateChange: handleRateChange,
      onSeeked: handleSeeked,
    },
    controlHandlers: {
      onPlayPauseIntent: handleControlPlayPauseIntent,
      onSeekCommitIntent: handleControlSeekCommitIntent,
    },
  };
}
