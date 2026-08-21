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
  classifyDrift,
  getDriftThresholds,
  nudgedRate,
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
import { useTelemetryRef } from '@/shared/lib/observability';

import { useHostAnchorEmitter } from './use-host-anchor-emitter';

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

// Drives the pure syncReducer and applies its effects to the Vidstack player.
// Decision policy stays in sync-machine/sync-math; this hook owns React/player I/O.
export function useSyncController(
  playerRef: React.RefObject<MediaPlayerInstance | null>,
  room: Room,
  isHost: boolean,
  serverClock: () => number,
  roomEvents: Pick<RoomRealtimeEvents, 'onAnchor'>,
  broadcastAnchor?: (anchor: PlaybackAnchor) => void,
) {
  const [state, setState] = useState<SyncState>(() => initialSyncState(isHost));
  const stateRef = useRef(state);
  const telemetryRef = useTelemetryRef();

  const anchorRef = useRef<PlaybackAnchor>({
    isPlaying: room.is_playing,
    anchorPosition: room.anchor_position,
    anchorServerTs: new Date(room.anchor_server_ts).getTime(),
    playbackRate: room.playback_rate,
  });

  // Ignore play/pause/seeked events emitted by reconcile itself. YouTube iframe
  // events are synthetic, so isOriginTrusted alone is not a reliable boundary.
  const programmaticUntilRef = useRef(0);
  const PROGRAMMATIC_WINDOW_MS = 1500;
  const markProgrammatic = () => {
    programmaticUntilRef.current = Date.now() + PROGRAMMATIC_WINDOW_MS;
  };
  const isWithinProgrammaticWindow = () => Date.now() < programmaticUntilRef.current;

  // Stable indirection lets realtime subscriptions and the reconcile interval
  // reach fresh closures without mutating refs during render.
  const dispatchRef = useRef<(event: SyncEvent) => void>(() => {});
  const reconcileNowRef = useRef<() => void>(() => {});

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

  const reconcileNow = () => {
    const player = playerRef.current;
    if (!player) return;
    const anchor = anchorRef.current;
    const expected = calculateExpectedPosition(anchor, serverClock());
    const drift = expected - player.currentTime;
    const action = classifyDrift(Math.abs(drift), getDriftThresholds(room.source_type));
    dispatchRef.current({ type: 'DRIFT_TICK', action, drift });
  };

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

  const dispatch = (event: SyncEvent) => {
    const prev = stateRef.current;
    const { state: next, effects } = syncReducer(prev, event);
    stateRef.current = next;
    setState(next);
    for (const effect of effects) applyEffect(effect);
    const telemetry = telemetryRef.current;
    for (const e of syncTelemetryEvents(prev, event, next)) telemetry.event(e.name, e.attrs);
  };

  useEffect(() => {
    dispatchRef.current = dispatch;
    reconcileNowRef.current = reconcileNow;
  });

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

  useEffect(() => {
    return roomEvents.onAnchor((newAnchor: PlaybackAnchor) => {
      if (!shouldAcceptPlaybackAnchor(anchorRef.current, newAnchor)) return;
      anchorRef.current = newAnchor;
      if (stateRef.current.role === 'host') return;
      dispatchRef.current({ type: 'ANCHOR_RECEIVED' });
    });
  }, [roomEvents]);

  useEffect(() => {
    if (isHost) return;
    const interval = setInterval(() => reconcileNowRef.current(), 1000);
    return () => clearInterval(interval);
  }, [isHost]);

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
