'use client';

import { useEffect, useRef, useState } from 'react';
import type {
  MediaPlayerInstance,
  MediaPlayEvent,
  MediaPauseEvent,
  MediaSeekedEvent,
} from '@vidstack/react';

import {
  shouldAcceptPersistedAnchorSnapshot,
  shouldAcceptPlaybackAnchor,
} from '../sync-math';
import {
  initialSyncState,
  selectSyncStatus,
  syncReducer,
  syncTelemetryEvents,
  type SyncEffect,
  type SyncEvent,
  type SyncState,
} from '../sync-machine';
import {
  applySyncEffect,
  createDriftTick,
  tryPlayWithMutedFallback,
} from '../sync-player-adapter';
import type { PlaybackAnchor, Room, RoomRealtimeEvents } from '../types';
import { useTelemetryRef } from '@/shared/lib/observability';

import { useHostAnchorEmitter } from './use-host-anchor-emitter';

// Numeric sync policy is canonical in `sync-math.ts`; keep these re-exports as
// the controller's compatibility/test surface while dependency direction stays pure.
export { classifyDrift, getDriftThresholds } from '../sync-math';
export type { DriftAction, DriftThresholds } from '../sync-math';
export { matchTransportState } from '../sync-player-adapter';

// ---------------------------------------------------------------------------
// Hook — drives the pure `syncReducer` (ADR-0011) and delegates Vidstack
// mutations to `sync-player-adapter.ts`. The reducer owns lifecycle decisions;
// the adapter owns player-effect interpretation; this hook owns React lifecycle,
// fresh-ref indirection, and host/follower event wiring.
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

  // Browsers can block unmuted autoplay. The adapter owns the concrete player
  // fallback sequence; the controller only maps terminal failure into machine state.
  const tryPlay = (player: MediaPlayerInstance) =>
    tryPlayWithMutedFallback(player, markProgrammatic, () => {
      dispatchRef.current({ type: 'GESTURE_REQUIRED' });
    });

  // Read the current player snapshot and feed one classified drift event into
  // the pure state machine. Threshold/math policy stays outside React.
  const reconcileNow = () => {
    const player = playerRef.current;
    if (!player) return;
    dispatchRef.current(createDriftTick(player, anchorRef.current, serverClock(), room.source_type));
  };

  // Effects always read the latest anchor and server clock. The adapter owns
  // Vidstack mutation semantics; this closure only supplies current dependencies.
  const applyEffect = (effect: SyncEffect) => {
    const player = playerRef.current;
    if (!player) return;
    applySyncEffect(effect, {
      player,
      anchor: anchorRef.current,
      sourceType: room.source_type,
      serverClock,
      tryPlay,
      markProgrammatic,
      reconcileNow,
    });
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
