import { describe, expect, it, vi } from 'vitest';

import {
  applySyncEffect,
  createDriftTick,
  matchTransportState,
  tryPlayWithMutedFallback,
} from '../../features/watch/sync-player-adapter';
import type { PlaybackAnchor } from '../../features/watch/types';

const pausedAnchor: PlaybackAnchor = {
  isPlaying: false,
  anchorPosition: 10,
  anchorServerTs: 1_000,
  playbackRate: 1,
};

const playingAnchor: PlaybackAnchor = {
  ...pausedAnchor,
  isPlaying: true,
};

function makePlayer(overrides: Record<string, unknown> = {}) {
  return {
    paused: true,
    currentTime: 10,
    playbackRate: 1,
    muted: false,
    play: vi.fn().mockResolvedValue(undefined),
    pause: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function makeEffectContext(overrides: Record<string, unknown> = {}) {
  return {
    player: makePlayer(),
    anchor: pausedAnchor,
    sourceType: 'url' as const,
    serverClock: () => 1_000,
    tryPlay: vi.fn(),
    markProgrammatic: vi.fn(),
    reconcileNow: vi.fn(),
    ...overrides,
  };
}

describe('sync player adapter', () => {
  describe('createDriftTick', () => {
    it('classifies a YouTube player inside its wider deadband as in-sync', () => {
      const player = makePlayer({ currentTime: 10.2 });
      const event = createDriftTick(player as never, playingAnchor, 2_000, 'youtube');

      expect(event.type).toBe('DRIFT_TICK');
      expect(event.action).toBe('in-sync');
      expect(event.drift).toBeCloseTo(0.8);
    });

    it('uses direct-source thresholds when classifying the same drift', () => {
      const player = makePlayer({ currentTime: 10.2 });
      const event = createDriftTick(player as never, playingAnchor, 2_000, 'url');

      expect(event.action).toBe('nudge');
      expect(event.drift).toBeCloseTo(0.8);
    });
  });

  describe('matchTransportState', () => {
    it('delegates play when the host anchor is playing and the player is paused', () => {
      const player = makePlayer({ paused: true });
      const tryPlay = vi.fn();
      const markProgrammatic = vi.fn();

      matchTransportState(player as never, playingAnchor, tryPlay, markProgrammatic);

      expect(tryPlay).toHaveBeenCalledWith(player);
      expect(markProgrammatic).not.toHaveBeenCalled();
      expect(player.pause).not.toHaveBeenCalled();
    });

    it('marks and pauses when the host anchor is paused and the player is playing', () => {
      const player = makePlayer({ paused: false });
      const tryPlay = vi.fn();
      const markProgrammatic = vi.fn();

      matchTransportState(player as never, pausedAnchor, tryPlay, markProgrammatic);

      expect(tryPlay).not.toHaveBeenCalled();
      expect(markProgrammatic).toHaveBeenCalledTimes(1);
      expect(player.pause).toHaveBeenCalledTimes(1);
    });
  });

  describe('tryPlayWithMutedFallback', () => {
    it('plays once without muting when normal autoplay succeeds', async () => {
      const player = makePlayer();
      const markProgrammatic = vi.fn();
      const onGestureRequired = vi.fn();

      tryPlayWithMutedFallback(player as never, markProgrammatic, onGestureRequired);
      await Promise.resolve();

      expect(markProgrammatic).toHaveBeenCalledTimes(1);
      expect(player.play).toHaveBeenCalledTimes(1);
      expect(player.muted).toBe(false);
      expect(onGestureRequired).not.toHaveBeenCalled();
    });

    it('retries muted after the first autoplay rejection', async () => {
      const player = makePlayer({
        play: vi
          .fn()
          .mockRejectedValueOnce(new Error('autoplay blocked'))
          .mockResolvedValueOnce(undefined),
      });
      const markProgrammatic = vi.fn();
      const onGestureRequired = vi.fn();

      tryPlayWithMutedFallback(player as never, markProgrammatic, onGestureRequired);
      await Promise.resolve();
      await Promise.resolve();

      expect(markProgrammatic).toHaveBeenCalledTimes(2);
      expect(player.play).toHaveBeenCalledTimes(2);
      expect(player.muted).toBe(true);
      expect(onGestureRequired).not.toHaveBeenCalled();
    });

    it('reports gesture-required only after muted autoplay also fails', async () => {
      const player = makePlayer({
        play: vi.fn().mockRejectedValue(new Error('autoplay blocked')),
      });
      const onGestureRequired = vi.fn();

      tryPlayWithMutedFallback(player as never, vi.fn(), onGestureRequired);
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();

      expect(player.play).toHaveBeenCalledTimes(2);
      expect(player.muted).toBe(true);
      expect(onGestureRequired).toHaveBeenCalledTimes(1);
    });
  });

  describe('applySyncEffect', () => {
    it('matches playback rate to the authoritative anchor', () => {
      const player = makePlayer({ playbackRate: 1.5 });
      const context = makeEffectContext({ player });

      applySyncEffect({ type: 'match-rate' }, context as never);

      expect(player.playbackRate).toBe(1);
    });

    it('nudges playback rate toward the expected anchor position', () => {
      const player = makePlayer({ currentTime: 9, playbackRate: 1 });
      const context = makeEffectContext({ player });

      applySyncEffect({ type: 'nudge' }, context as never);

      expect(player.playbackRate).toBe(1.05);
    });

    it('marks a hard seek as programmatic before moving currentTime', () => {
      const player = makePlayer({ currentTime: 2 });
      const markProgrammatic = vi.fn();
      const context = makeEffectContext({ player, markProgrammatic });

      applySyncEffect({ type: 'seek-to-expected' }, context as never);

      expect(markProgrammatic).toHaveBeenCalledTimes(1);
      expect(player.currentTime).toBe(10);
    });

    it('does not rewrite currentTime when already within the seek tolerance', () => {
      const player = makePlayer({ currentTime: 10.005 });
      const markProgrammatic = vi.fn();
      const context = makeEffectContext({ player, markProgrammatic });

      applySyncEffect({ type: 'seek-to-expected' }, context as never);

      expect(markProgrammatic).not.toHaveBeenCalled();
      expect(player.currentTime).toBe(10.005);
    });

    it('delegates immediate reconciliation without interpreting machine state', () => {
      const reconcileNow = vi.fn();
      const context = makeEffectContext({ reconcileNow });

      applySyncEffect({ type: 'reconcile-now' }, context as never);

      expect(reconcileNow).toHaveBeenCalledTimes(1);
    });

    it('unmutes the player for gesture recovery', () => {
      const player = makePlayer({ muted: true });
      const context = makeEffectContext({ player });

      applySyncEffect({ type: 'unmute' }, context as never);

      expect(player.muted).toBe(false);
    });
  });
});
