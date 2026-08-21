import type { MediaPlayerInstance } from '@vidstack/react';

import {
  calculateExpectedPosition,
  classifyDrift,
  getDriftThresholds,
  nudgedRate,
} from './sync-math';
import type { SyncEffect, SyncEvent } from './sync-machine';
import type { PlaybackAnchor, Room } from './types';

type DriftTickEvent = Extract<SyncEvent, { type: 'DRIFT_TICK' }>;

type SyncPlayerEffectContext = {
  player: MediaPlayerInstance;
  anchor: PlaybackAnchor;
  sourceType: Room['source_type'];
  serverClock: () => number;
  tryPlay: (player: MediaPlayerInstance) => void;
  markProgrammatic: () => void;
  reconcileNow: () => void;
};

type SyncPlayerEffectExecutor = (context: SyncPlayerEffectContext) => void;

export function createDriftTick(
  player: Pick<MediaPlayerInstance, 'currentTime'>,
  anchor: PlaybackAnchor,
  serverNow: number,
  sourceType: Room['source_type'],
): DriftTickEvent {
  const expected = calculateExpectedPosition(anchor, serverNow);
  const drift = expected - player.currentTime;
  return {
    type: 'DRIFT_TICK',
    action: classifyDrift(Math.abs(drift), getDriftThresholds(sourceType)),
    drift,
  };
}

export function matchTransportState(
  player: MediaPlayerInstance,
  anchor: PlaybackAnchor,
  tryPlay: (player: MediaPlayerInstance) => void,
  markProgrammatic: () => void,
) {
  // Matching states are (anchor playing, player playing) and
  // (anchor paused, player paused). Only the two equal booleans need action.
  if (anchor.isPlaying !== player.paused) return;
  if (anchor.isPlaying) {
    tryPlay(player);
    return;
  }
  markProgrammatic();
  player.pause().catch(() => {});
}

export function tryPlayWithMutedFallback(
  player: MediaPlayerInstance,
  markProgrammatic: () => void,
  onGestureRequired: () => void,
) {
  markProgrammatic();
  player.play().catch(() => {
    markProgrammatic();
    player.muted = true;
    player.play().catch(() => onGestureRequired());
  });
}

function matchRate({ player, anchor }: SyncPlayerEffectContext) {
  if (player.playbackRate !== anchor.playbackRate) {
    player.playbackRate = anchor.playbackRate;
  }
}

function nudgeTowardAnchor({ player, anchor, sourceType, serverClock }: SyncPlayerEffectContext) {
  const expected = calculateExpectedPosition(anchor, serverClock());
  const drift = expected - player.currentTime;
  const { nudge } = getDriftThresholds(sourceType);
  player.playbackRate = nudgedRate(anchor.playbackRate, drift, nudge);
}

function seekToExpected({ player, anchor, serverClock, markProgrammatic }: SyncPlayerEffectContext) {
  const expected = calculateExpectedPosition(anchor, serverClock());
  if (Math.abs(player.currentTime - expected) <= 0.01) return;
  markProgrammatic();
  player.currentTime = expected;
}

const SYNC_EFFECT_EXECUTORS: Record<SyncEffect['type'], SyncPlayerEffectExecutor> = {
  'match-transport': ({ player, anchor, tryPlay, markProgrammatic }) =>
    matchTransportState(player, anchor, tryPlay, markProgrammatic),
  'match-rate': matchRate,
  nudge: nudgeTowardAnchor,
  'seek-to-expected': seekToExpected,
  'reconcile-now': ({ reconcileNow }) => reconcileNow(),
  unmute: ({ player }) => {
    player.muted = false;
  },
};

export function applySyncEffect(effect: SyncEffect, context: SyncPlayerEffectContext) {
  SYNC_EFFECT_EXECUTORS[effect.type](context);
}
