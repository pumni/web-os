'use client';

import { useEffect, useRef, useState } from 'react';
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
import {
  initialSyncState,
  nudgedRate,
  selectSyncStatus,
  syncReducer,
  syncTelemetryEvents,
  type SyncEffect,
  type SyncEvent,
  type SyncState,
} from '../sync-machine';
import { useTelemetryRef } from '@/shared/lib/observability';

import { useHostAnchorEmitter } from './use-host-anchor-emitter';

// ---------------------------------------------------------------------------
// Pure helpers — no side-effects, no refs (kept here as the controller's
// public test surface; the lifecycle itself now lives in `../sync-machine`).
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
// Hook — drives the pure `syncReducer` (ADR-0011) and applies its effects to
// the Vidstack player. The reducer owns the lifecycle (following / quality /
// gesture / role); this hook is the thin executor. Plain functions capture
// fresh props each render; refs provide stable indirection for the realtime
// subscription and the reconcile interval.
// ---------------------------------------------------------------------------

export function useSyncController(
  playerRef: React.RefObject<MediaPlayerInstance | null>,
  room: Room,
  isHost: boolean,
  serverClock: () => number,
  roomEvents: Pick<RoomRealtimeEvents, 'onAnchor'>,
  broadcastAnchor?: (anchor: PlaybackAnchor) => void,
) {
  // Single source of truth for the sync lifecycle. `stateRef` mirrors it so the
  // imperative paths read fresh values synchronously after a dispatch — without
  // a second set of boolean refs (the old isFollowingHostRef/needsGestureRef).
  const [state, setState] = useState<SyncState>(() => initialSyncState(isHost));
  const stateRef = useRef(state);
  const telemetryRef = useTelemetryRef();

  const anchorRef = useRef<PlaybackAnchor>({
    isPlaying: room.is_playing,
    anchorPosition: room.anchor_position,
    anchorServerTs: new Date(room.anchor_server_ts).getTime(),
    playbackRate: room.playback_rate,
  });

  // Programmatic window: ignore play/pause/seeked events emitted by reconcile
  // itself. Required because `isOriginTrusted` is unreliable on YouTube
  // (synthetic iframe events), which previously caused false sync breakages.
  const programmaticUntilRef = useRef(0);
  const PROGRAMMATIC_WINDOW_MS = 1500; // YouTube bridge async; adjust if needed
  const markProgrammatic = () => {
    programmaticUntilRef.current = Date.now() + PROGRAMMATIC_WINDOW_MS;
  };
  const isWithinProgrammaticWindow = () => Date.now() < programmaticUntilRef.current;

  // Stable indirection to the latest dispatch / reconcile, broken out so the
  // realtime subscription and interval reach the freshest closure (and so the
  // callbacks below avoid a definition cycle). Synced in an effect, never during
  // render — see `react-hooks/refs`.
  const dispatchRef = useRef<(event: SyncEvent) => void>(() => {});
  const reconcileNowRef = useRef<() => void>(() => {});

  // Robust play: browsers block unmuted autoplay without a user gesture. Fall
  // back to muted autoplay (always allowed); if even that fails, surface a
  // tap-to-play overlay via the GESTURE_REQUIRED event.
  const tryPlay = (player: MediaPlayerInstance) => {
    markProgrammatic();
    player.play().catch(() => {
      markProgrammatic();
      player.muted = true;
      player.play().catch(() => {
        dispatchRef.current({ type: 'GESTURE_REQUIRED' });
      });
    });
  };

  // Compute current drift against the host anchor and feed the machine a tick.
  const reconcileNow = () => {
    const player = playerRef.current;
    if (!player) return;
    const anchor = anchorRef.current;
    const expected = calculateExpectedPosition(anchor, serverClock());
    const drift = expected - player.currentTime;
    const action = classifyDrift(Math.abs(drift), getDriftThresholds(room.source_type));
    dispatchRef.current({ type: 'DRIFT_TICK', action, drift });
  };

  // Apply one reducer effect to the player. Effects recompute live position from
  // the current anchor + server clock, so they always act on fresh state.
  const applyEffect = (effect: SyncEffect) => {
    const player = playerRef.current;
    if (!player) return;
    const anchor = anchorRef.current;
    switch (effect.type) {
      case 'match-transport':
        matchTransportState(player, anchor, tryPlay, markProgrammatic);
        break;
      case 'match-rate':
        if (player.playbackRate !== anchor.playbackRate) {
          player.playbackRate = anchor.playbackRate;
        }
        break;
      case 'nudge': {
        const expected = calculateExpectedPosition(anchor, serverClock());
        const drift = expected - player.currentTime;
        const { nudge } = getDriftThresholds(room.source_type);
        player.playbackRate = nudgedRate(anchor.playbackRate, drift, nudge);
        break;
      }
      case 'seek-to-expected': {
        const expected = calculateExpectedPosition(anchor, serverClock());
        if (Math.abs(player.currentTime - expected) > 0.01) {
          markProgrammatic();
          player.currentTime = expected;
        }
        break;
      }
      case 'reconcile-now':
        reconcileNow();
        break;
      case 'unmute':
        player.muted = false;
        break;
    }
  };

  // Run the pure reducer, commit the next state, then apply its effects. Called
  // only from events/effects (never render), so the stateRef write is allowed.
  const dispatch = (event: SyncEvent) => {
    const prev = stateRef.current;
    const { state: next, effects } = syncReducer(prev, event);
    stateRef.current = next;
    setState(next);
    for (const effect of effects) applyEffect(effect);
    const telemetry = telemetryRef.current;
    for (const e of syncTelemetryEvents(prev, event, next)) telemetry.event(e.name, e.attrs);
  };

  // Sync the stable handles after each commit (never during render).
  useEffect(() => {
    dispatchRef.current = dispatch;
    reconcileNowRef.current = reconcileNow;
  });

  // Role flip (host transfer). Dispatched from an effect to respect ref
  // discipline; ROLE_CHANGED has no effects, so the extra commit is harmless.
  const prevIsHostRef = useRef(isHost);
  useEffect(() => {
    if (prevIsHostRef.current !== isHost) {
      prevIsHostRef.current = isHost;
      dispatchRef.current({ type: 'ROLE_CHANGED', isHost });
    }
  }, [isHost]);

  const emitAnchor = useHostAnchorEmitter({
    anchorRef,
    playerRef,
    roomId: room.id,
    isHost,
    serverClock,
    broadcastAnchor,
  });

  // Adopt the persisted room anchor when the server snapshot is newer.
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

  // Receive a host anchor over realtime: accept-or-drop, store, then re-engage +
  // reconcile via the machine (the host stores it but runs no follower effect).
  useEffect(() => {
    return roomEvents.onAnchor((newAnchor: PlaybackAnchor) => {
      if (!shouldAcceptPlaybackAnchor(anchorRef.current, newAnchor)) return;
      anchorRef.current = newAnchor;
      if (stateRef.current.role === 'host') return;
      dispatchRef.current({ type: 'ANCHOR_RECEIVED' });
    });
  }, [roomEvents]);

  // Periodic follower drift check. We deliberately do NOT gate on
  // document.hidden: background-tab audio must stay aligned, and the machine
  // no-ops the tick for hosts / detached followers anyway.
  useEffect(() => {
    if (isHost) return;
    const interval = setInterval(() => reconcileNowRef.current(), 1000);
    return () => clearInterval(interval);
  }, [isHost]);

  // --- Public commands & handlers -------------------------------------------
  const resync = () => dispatchRef.current({ type: 'RESYNC_CMD' });
  const resumeFromGesture = () => dispatchRef.current({ type: 'GESTURE_RESUMED' });

  const isFollowerManualEvent = (e?: { isOriginTrusted?: boolean }) =>
    !isWithinProgrammaticWindow() && e?.isOriginTrusted !== false;

  const handleFollowerManualInteraction = () => dispatchRef.current({ type: 'MANUAL_INTERACTION' });

  const handlePlay = (e?: MediaPlayEvent) => {
    if (isHost) emitAnchor();
    else if (isFollowerManualEvent(e)) handleFollowerManualInteraction();
  };

  const handlePause = (e?: MediaPauseEvent) => {
    if (isHost) emitAnchor();
    else if (isFollowerManualEvent(e)) handleFollowerManualInteraction();
  };

  const handleRateChange = () => {
    if (isHost) emitAnchor();
  };

  const handleSeeked = (_detail?: number, e?: MediaSeekedEvent) => {
    if (isHost) emitAnchor();
    else if (isFollowerManualEvent(e)) handleFollowerManualInteraction();
  };

  const handleControlPlayPauseIntent = () => {
    if (isHost) {
      const player = playerRef.current;
      if (player) {
        // Force the target state immediately based on host intent to enable
        // parallel buffering/play.
        const targetPlaying = player.paused;
        emitAnchor({ overridePlaying: targetPlaying });
      }
    } else {
      handleFollowerManualInteraction();
    }
  };

  const handleControlSeekCommitIntent = () => {
    if (isHost) emitAnchor();
    else handleFollowerManualInteraction();
  };

  return {
    syncStatus: selectSyncStatus(state),
    isFollowingHost: state.following,
    needsGesture: state.gestureRequired,
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
