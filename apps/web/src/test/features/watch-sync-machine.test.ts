import { describe, it, expect } from 'vitest';
import {
  initialSyncState,
  syncReducer,
  selectSyncStatus,
  selectPhase,
  nudgedRate,
  syncTelemetryEvents,
  type SyncEvent,
  type SyncState,
} from '../../features/watch/sync-machine';

const follower = (overrides: Partial<SyncState> = {}): SyncState => ({
  ...initialSyncState(false),
  ...overrides,
});

const host = (overrides: Partial<SyncState> = {}): SyncState => ({
  ...initialSyncState(true),
  ...overrides,
});

describe('sync-machine reducer (ADR-0011, behaviour-preserving)', () => {
  it('seeds a follower idle-but-following, a host as host', () => {
    expect(initialSyncState(false)).toEqual({
      role: 'follower',
      following: true,
      quality: 'in-sync',
      gestureRequired: false,
      connection: 'connecting',
      clockReady: false,
    });
    expect(initialSyncState(true).role).toBe('host');
  });

  it('never mutates the input state', () => {
    const state = follower();
    const frozen = Object.freeze({ ...state });
    expect(() => syncReducer(frozen, { type: 'MANUAL_INTERACTION' })).not.toThrow();
  });

  describe('ROLE_CHANGED', () => {
    it('promoting to host derives "host" status and re-locks follow', () => {
      const next = syncReducer(
        follower({ following: false, quality: 'catching-up' }),
        { type: 'ROLE_CHANGED', isHost: true },
      );
      expect(next.state.role).toBe('host');
      expect(next.state.following).toBe(true);
      expect(selectSyncStatus(next.state)).toBe('host');
      expect(next.effects).toEqual([]);
    });

    it('demoting to follower resets to a clean in-sync follow', () => {
      const next = syncReducer(host(), { type: 'ROLE_CHANGED', isHost: false });
      expect(next.state.role).toBe('follower');
      expect(next.state.following).toBe(true);
      expect(selectSyncStatus(next.state)).toBe('in-sync');
    });
  });

  describe('DRIFT_TICK', () => {
    it('is a no-op for the host', () => {
      const next = syncReducer(host(), { type: 'DRIFT_TICK', action: 'seek' });
      expect(next.effects).toEqual([]);
      expect(next.state).toEqual(host());
    });

    it('is a no-op for a detached follower (reconcile bypass)', () => {
      const next = syncReducer(follower({ following: false }), {
        type: 'DRIFT_TICK',
        action: 'nudge',
      });
      expect(next.effects).toEqual([]);
    });

    it('in-sync: matches transport + rate and reports in-sync', () => {
      const next = syncReducer(follower({ quality: 'catching-up' }), {
        type: 'DRIFT_TICK',
        action: 'in-sync',
      });
      expect(next.state.quality).toBe('in-sync');
      expect(next.effects).toEqual([{ type: 'match-transport' }, { type: 'match-rate' }]);
    });

    it('nudge: matches transport + nudges and reports catching-up', () => {
      const next = syncReducer(follower(), { type: 'DRIFT_TICK', action: 'nudge' });
      expect(next.state.quality).toBe('catching-up');
      expect(next.effects).toEqual([{ type: 'match-transport' }, { type: 'nudge' }]);
    });

    it('seek: matches transport, hard-seeks, restores rate, catching-up', () => {
      const next = syncReducer(follower(), { type: 'DRIFT_TICK', action: 'seek' });
      expect(next.state.quality).toBe('catching-up');
      expect(next.effects).toEqual([
        { type: 'match-transport' },
        { type: 'seek-to-expected' },
        { type: 'match-rate' },
      ]);
    });
  });

  describe('MANUAL_INTERACTION', () => {
    it('detaches a follower and marks it catching-up', () => {
      const next = syncReducer(follower(), { type: 'MANUAL_INTERACTION' });
      expect(next.state.following).toBe(false);
      expect(next.state.quality).toBe('catching-up');
      expect(next.effects).toEqual([]);
    });

    it('is ignored for the host (host actions are the source of truth)', () => {
      const next = syncReducer(host(), { type: 'MANUAL_INTERACTION' });
      expect(next.state).toEqual(host());
    });
  });

  describe('ANCHOR_RECEIVED', () => {
    it('re-engages a detached follower and reconciles immediately', () => {
      const next = syncReducer(follower({ following: false }), { type: 'ANCHOR_RECEIVED' });
      expect(next.state.following).toBe(true);
      expect(next.effects).toEqual([{ type: 'reconcile-now' }]);
    });

    it('is a no-op for the host', () => {
      const next = syncReducer(host(), { type: 'ANCHOR_RECEIVED' });
      expect(next.effects).toEqual([]);
    });
  });

  describe('RESYNC_CMD', () => {
    it('re-engages follow and snaps to the host', () => {
      const next = syncReducer(follower({ following: false }), { type: 'RESYNC_CMD' });
      expect(next.state.following).toBe(true);
      expect(next.effects).toEqual([
        { type: 'seek-to-expected' },
        { type: 'match-rate' },
        { type: 'match-transport' },
      ]);
    });
  });

  describe('autoplay gesture lifecycle', () => {
    it('GESTURE_REQUIRED flags the need for a user gesture', () => {
      const next = syncReducer(follower(), { type: 'GESTURE_REQUIRED' });
      expect(next.state.gestureRequired).toBe(true);
      expect(selectPhase(next.state)).toBe('idle'); // clock not ready yet
    });

    it('GESTURE_RESUMED unmutes, clears the flag, and resyncs', () => {
      const next = syncReducer(
        follower({ gestureRequired: true, following: false, clockReady: true }),
        { type: 'GESTURE_RESUMED' },
      );
      expect(next.state.gestureRequired).toBe(false);
      expect(next.state.following).toBe(true);
      expect(next.effects).toEqual([
        { type: 'unmute' },
        { type: 'seek-to-expected' },
        { type: 'match-rate' },
        { type: 'match-transport' },
      ]);
    });
  });

  describe('CLOCK_READY / CHANNEL_STATUS (additive, inert)', () => {
    it('CLOCK_READY only flips clockReady, no effects', () => {
      const next = syncReducer(follower(), { type: 'CLOCK_READY' });
      expect(next.state.clockReady).toBe(true);
      expect(next.effects).toEqual([]);
    });

    it('CHANNEL_STATUS only records connectivity, no effects', () => {
      const next = syncReducer(follower(), {
        type: 'CHANNEL_STATUS',
        status: 'disconnected',
      });
      expect(next.state.connection).toBe('disconnected');
      expect(next.effects).toEqual([]);
    });
  });
});

describe('selectPhase (highest condition wins)', () => {
  it('host always reports host', () => {
    expect(selectPhase(host({ connection: 'disconnected' }))).toBe('host');
  });

  it('idle until the clock is ready', () => {
    expect(selectPhase(follower({ clockReady: false }))).toBe('idle');
  });

  it('disconnected outranks gesture/detach/quality', () => {
    expect(
      selectPhase(
        follower({ clockReady: true, connection: 'disconnected', gestureRequired: true }),
      ),
    ).toBe('disconnected');
  });

  it('gesture-required outranks detach/quality', () => {
    expect(
      selectPhase(follower({ clockReady: true, connection: 'connected', gestureRequired: true })),
    ).toBe('gesture-required');
  });

  it('detached when following is broken', () => {
    expect(
      selectPhase(follower({ clockReady: true, connection: 'connected', following: false })),
    ).toBe('detached');
  });

  it('falls through to drift quality when following and healthy', () => {
    expect(
      selectPhase(follower({ clockReady: true, connection: 'connected', quality: 'catching-up' })),
    ).toBe('catching-up');
  });
});

describe('syncTelemetryEvents (derived from transitions, low-noise)', () => {
  const emit = (state: SyncState, event: SyncEvent) =>
    syncTelemetryEvents(state, event, syncReducer(state, event).state);

  it('emits host.transfer only when the role actually changes', () => {
    expect(emit(follower(), { type: 'ROLE_CHANGED', isHost: true })).toEqual([
      { name: 'host.transfer', attrs: { role: 'host' } },
    ]);
    // No-op role "change" (already follower)
    expect(emit(follower(), { type: 'ROLE_CHANGED', isHost: false })).toEqual([]);
  });

  it('emits sync.seek with rounded drift only on a hard seek for an engaged follower', () => {
    expect(emit(follower(), { type: 'DRIFT_TICK', action: 'seek', drift: 3.14159 })).toEqual([
      { name: 'sync.seek', attrs: { drift: 3.14 } },
    ]);
    expect(emit(follower(), { type: 'DRIFT_TICK', action: 'nudge', drift: 1 })).toEqual([]);
    expect(emit(follower({ following: false }), { type: 'DRIFT_TICK', action: 'seek' })).toEqual([]);
    expect(emit(host(), { type: 'DRIFT_TICK', action: 'seek', drift: 5 })).toEqual([]);
  });

  it('emits sync.detached only on the following → detached edge', () => {
    expect(emit(follower(), { type: 'MANUAL_INTERACTION' })).toEqual([
      { name: 'sync.detached', attrs: {} },
    ]);
    expect(emit(follower({ following: false }), { type: 'MANUAL_INTERACTION' })).toEqual([]);
  });

  it('distinguishes command vs gesture resync', () => {
    expect(emit(follower(), { type: 'RESYNC_CMD' })).toEqual([
      { name: 'sync.resync', attrs: { from: 'command' } },
    ]);
    expect(emit(follower({ gestureRequired: true }), { type: 'GESTURE_RESUMED' })).toEqual([
      { name: 'sync.resync', attrs: { from: 'gesture' } },
    ]);
  });

  it('emits gesture_required once on the edge', () => {
    expect(emit(follower(), { type: 'GESTURE_REQUIRED' })).toEqual([
      { name: 'sync.gesture_required', attrs: {} },
    ]);
    expect(emit(follower({ gestureRequired: true }), { type: 'GESTURE_REQUIRED' })).toEqual([]);
  });

  it('emits channel.status only on a connectivity change', () => {
    expect(emit(follower(), { type: 'CHANNEL_STATUS', status: 'disconnected' })).toEqual([
      { name: 'channel.status', attrs: { status: 'disconnected' } },
    ]);
    expect(emit(follower({ connection: 'connecting' }), {
      type: 'CHANNEL_STATUS',
      status: 'connecting',
    })).toEqual([]);
  });
});

describe('nudgedRate', () => {
  it('shifts the rate up when behind (positive drift)', () => {
    expect(nudgedRate(1.0, 0.5, 0.07)).toBeCloseTo(1.07);
  });

  it('shifts the rate down when ahead (negative drift)', () => {
    expect(nudgedRate(1.0, -0.5, 0.07)).toBeCloseTo(0.93);
  });

  it('clamps to the [0.5, 2.0] safe range', () => {
    expect(nudgedRate(2.0, 1, 0.5)).toBe(2.0);
    expect(nudgedRate(0.5, -1, 0.5)).toBe(0.5);
  });
});
