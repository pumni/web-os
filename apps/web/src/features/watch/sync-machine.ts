import type { DriftAction } from './sync-math';

export { nudgedRate } from './sync-math';

/**
 * Pure state machine for watch playback sync (ADR-0011).
 *
 * This module owns the *follower lifecycle* as a finite, side-effect-free
 * reducer: `(state, event) => { state, effects }`. It has no React, player, or
 * network dependencies, so the whole lifecycle — drift reconciliation, manual
 * detach/resync, autoplay-gesture recovery, host-role flips — is unit-tested in
 * isolation.
 *
 * The reducer decides *which* effect class to run; the numeric math
 * (`calculateExpectedPosition`, `classifyDrift`, `nudgedRate`) stays pure in
 * `sync-math.ts`, and a thin executor reads the player, calls those helpers,
 * dispatches `DRIFT_TICK`, and applies the returned effects.
 *
 * It is deliberately behaviour-preserving against the current imperative
 * controller (`hooks/use-sync-controller.ts`); see the test suite for the
 * transition-by-transition mapping.
 */

export type SyncRole = 'host' | 'follower';
export type SyncQuality = 'in-sync' | 'catching-up';
export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected';

/**
 * Richer phase used for telemetry and UI. Distinct from {@link selectSyncStatus},
 * which preserves the legacy 3-value public contract.
 */
export type SyncPhase =
  | 'host'
  | 'idle'
  | 'in-sync'
  | 'catching-up'
  | 'gesture-required'
  | 'detached'
  | 'disconnected';

export interface SyncState {
  /** Whether this client is the authoritative host or a follower. */
  role: SyncRole;
  /** Follower is tracking the host anchor. False once the user manually scrubs. */
  following: boolean;
  /** Drift quality of the last reconcile tick. */
  quality: SyncQuality;
  /** Autoplay was blocked; a real user gesture is required to resume. */
  gestureRequired: boolean;
  /** Realtime channel connectivity (tracked for phase/telemetry; inert today). */
  connection: ConnectionStatus;
  /** Server-clock offset has been established at least once. */
  clockReady: boolean;
}

export type SyncEvent =
  | { type: 'ROLE_CHANGED'; isHost: boolean }
  | { type: 'CLOCK_READY' }
  | { type: 'CHANNEL_STATUS'; status: ConnectionStatus }
  | { type: 'ANCHOR_RECEIVED' }
  | { type: 'DRIFT_TICK'; action: DriftAction; drift?: number }
  | { type: 'MANUAL_INTERACTION' }
  | { type: 'RESYNC_CMD' }
  | { type: 'GESTURE_REQUIRED' }
  | { type: 'GESTURE_RESUMED' };

export type SyncEffect =
  | { type: 'match-transport' }
  | { type: 'match-rate' }
  | { type: 'nudge' }
  | { type: 'seek-to-expected' }
  | { type: 'reconcile-now' }
  | { type: 'unmute' };

export interface SyncTransition {
  state: SyncState;
  effects: SyncEffect[];
}

export function initialSyncState(isHost: boolean): SyncState {
  return {
    role: isHost ? 'host' : 'follower',
    following: true,
    quality: 'in-sync',
    gestureRequired: false,
    connection: 'connecting',
    clockReady: false,
  };
}

const NONE: SyncEffect[] = [];

export function syncReducer(state: SyncState, event: SyncEvent): SyncTransition {
  switch (event.type) {
    case 'ROLE_CHANGED':
      return {
        state: {
          ...state,
          role: event.isHost ? 'host' : 'follower',
          following: true,
          quality: 'in-sync',
        },
        effects: NONE,
      };
    case 'CLOCK_READY':
      return { state: { ...state, clockReady: true }, effects: NONE };
    case 'CHANNEL_STATUS':
      return { state: { ...state, connection: event.status }, effects: NONE };
    case 'ANCHOR_RECEIVED':
      if (state.role === 'host') return { state, effects: NONE };
      return { state: { ...state, following: true }, effects: [{ type: 'reconcile-now' }] };
    case 'DRIFT_TICK': {
      if (state.role === 'host' || !state.following) return { state, effects: NONE };
      switch (event.action) {
        case 'in-sync':
          return {
            state: { ...state, quality: 'in-sync' },
            effects: [{ type: 'match-transport' }, { type: 'match-rate' }],
          };
        case 'nudge':
          return {
            state: { ...state, quality: 'catching-up' },
            effects: [{ type: 'match-transport' }, { type: 'nudge' }],
          };
        case 'seek':
          return {
            state: { ...state, quality: 'catching-up' },
            effects: [
              { type: 'match-transport' },
              { type: 'seek-to-expected' },
              { type: 'match-rate' },
            ],
          };
        default:
          return assertNever(event.action);
      }
    }
    case 'MANUAL_INTERACTION':
      if (state.role === 'host') return { state, effects: NONE };
      return { state: { ...state, following: false, quality: 'catching-up' }, effects: NONE };
    case 'RESYNC_CMD':
      return {
        state: { ...state, following: true },
        effects: [
          { type: 'seek-to-expected' },
          { type: 'match-rate' },
          { type: 'match-transport' },
        ],
      };
    case 'GESTURE_REQUIRED':
      return { state: { ...state, gestureRequired: true }, effects: NONE };
    case 'GESTURE_RESUMED':
      return {
        state: { ...state, gestureRequired: false, following: true },
        effects: [
          { type: 'unmute' },
          { type: 'seek-to-expected' },
          { type: 'match-rate' },
          { type: 'match-transport' },
        ],
      };
    default:
      return assertNever(event);
  }
}

export function selectSyncStatus(state: SyncState): 'host' | 'in-sync' | 'catching-up' {
  return state.role === 'host' ? 'host' : state.quality;
}

export function selectPhase(state: SyncState): SyncPhase {
  if (state.role === 'host') return 'host';
  if (!state.clockReady) return 'idle';
  if (state.connection === 'disconnected') return 'disconnected';
  if (state.gestureRequired) return 'gesture-required';
  if (!state.following) return 'detached';
  return state.quality;
}

export interface SyncTelemetryEvent {
  name: string;
  attrs: Record<string, string | number | boolean>;
}

export function syncTelemetryEvents(
  prev: SyncState,
  event: SyncEvent,
  next: SyncState,
): SyncTelemetryEvent[] {
  switch (event.type) {
    case 'ROLE_CHANGED':
      return prev.role !== next.role ? [{ name: 'host.transfer', attrs: { role: next.role } }] : [];
    case 'DRIFT_TICK':
      if (next.role === 'follower' && next.following && event.action === 'seek') {
        const attrs: SyncTelemetryEvent['attrs'] = {};
        if (event.drift !== undefined) attrs.drift = Math.round(event.drift * 100) / 100;
        return [{ name: 'sync.seek', attrs }];
      }
      return [];
    case 'MANUAL_INTERACTION':
      return prev.following && !next.following ? [{ name: 'sync.detached', attrs: {} }] : [];
    case 'RESYNC_CMD':
      return [{ name: 'sync.resync', attrs: { from: 'command' } }];
    case 'GESTURE_REQUIRED':
      return !prev.gestureRequired && next.gestureRequired
        ? [{ name: 'sync.gesture_required', attrs: {} }]
        : [];
    case 'GESTURE_RESUMED':
      return [{ name: 'sync.resync', attrs: { from: 'gesture' } }];
    case 'CHANNEL_STATUS':
      return prev.connection !== next.connection
        ? [{ name: 'channel.status', attrs: { status: next.connection } }]
        : [];
    default:
      return [];
  }
}

function assertNever(value: never): never {
  throw new Error(`Unhandled sync machine variant: ${JSON.stringify(value)}`);
}
