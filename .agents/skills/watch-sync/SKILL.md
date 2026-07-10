---
name: watch-sync
description: Maintain the watch-together playback-sync architecture — a pure follower-lifecycle reducer, pure timing math, a thin effect executor, and transition-derived telemetry. Use when changing apps/web/src/features/watch sync code (sync-machine.ts, sync-math.ts, use-sync-controller.ts, use-server-clock.ts, use-room-channel.ts), or touching drift/seek/nudge behavior, anchor acceptance, host/follower roles, or realtime broadcast sync.
---

# Watch Sync

**Why this shape (ADR-0011):** the design splits a **pure decision core** (reducer + math) from a **thin side-effecting executor** so the whole follower lifecycle is unit-testable without React, a player, or the network. Adding behavior in a controller branch breaks that isolation, and ad-hoc `track()` calls drift from transitions — so both are banned.


## Rules

- **The reducer is pure.** `syncReducer(state, event) → { state, effects }` in
  `sync-machine.ts` owns the entire follower lifecycle (drift reconcile,
  detach/resync, autoplay-gesture recovery, host-role flips). No React, player,
  or network access; never mutate input state. New lifecycle behavior = a new
  `SyncEvent`/`SyncEffect` variant + a transition test, **never** a branch added
  to the React controller.
- **Numeric math is pure too.** `calculateExpectedPosition`, `nudgedRate`,
  `selectBestClockSample`, and the anchor-acceptance predicates live in
  `sync-math.ts`. The reducer decides *which* effect class; math computes the
  numbers. Keep both side-effect-free.
- **One executor owns side effects.** `use-sync-controller.ts` reads the player,
  calls the math, dispatches `DRIFT_TICK`, and applies returned `effects`
  (`match-transport`, `match-rate`, `nudge`, `seek-to-expected`, `reconcile-now`,
  `unmute`). It is the only place player I/O happens.
- **Telemetry is derived, not hand-placed.** Emit via
  `syncTelemetryEvents(prev, event, next)` so it cannot drift from behavior. Do
  not scatter `track()` calls in the controller. The observability seam is a
  vendor-neutral no-op; keep it that way (no vendor SDK).
- **Anchor acceptance protects the freshest source.** Use
  `shouldAcceptPlaybackAnchor`: versioned live `broadcast` anchors dedupe by
  `originSessionId` + `sequence`; an unversioned persisted (`postgres_changes`)
  snapshot is accepted only if strictly newer by `anchorServerTs`. A delayed DB
  event must never clobber a fresher broadcast.
- **Host fans out in parallel.** The host emits anchors over low-latency realtime
  `broadcast` *and* persists to the DB; followers dedupe by sequence. Host's own
  interactions are the source of truth (not a detach); a follower's
  `MANUAL_INTERACTION` sets `following=false` until `RESYNC_CMD`.
- **Clock offset is Cristian-style.** `useServerClock` probes N≈3× per sync and
  keeps the min-RTT sample to bound half-RTT asymmetry error; `clockReady` gates
  the sync phase. Do not average samples.
- **Stay behaviour-preserving.** This module is mapped transition-by-transition
  to the legacy controller in the test suite; preserve `selectSyncStatus`'s
  3-value public contract. XState and direct vendor SDKs were declined as
  premature (ADR-0011) — do not introduce them.

## Known Failure Modes

| Symptom | Cause | Fix |
|---|---|---|
| Followers snap backward on a stale update | A delayed persisted (`postgres_changes`) snapshot clobbered a fresher live `broadcast` anchor | Route all anchors through `shouldAcceptPlaybackAnchor`; persisted snapshot wins only if strictly newer by `anchorServerTs` |
| Duplicate/echoed anchors re-trigger reconcile | Versioned live anchors not deduped by `originSessionId` + `sequence` | Dedupe in the anchor path, not the controller; never accept an unversioned snapshot over a versioned broadcast |
| Sync drifts under variable latency | Clock samples averaged instead of min-RTT selected | Use `selectBestClockSample` (keep min-RTT); `clockReady` gates the sync phase — do not average |
| New lifecycle behavior is untestable / regresses | A branch was added to the React controller instead of the reducer | Add a `SyncEvent`/`SyncEffect` variant + a transition test in `watch-sync-machine.test.ts`; keep `syncReducer` pure |
| Telemetry disagrees with actual transitions | Ad-hoc `track()` calls in the controller | Emit only via `syncTelemetryEvents(prev, event, next)` (derived, not hand-placed) |

## Checklist

- [ ] Lifecycle/branching change lives in `syncReducer`, not in the React controller.
- [ ] Reducer and `sync-math.ts` helpers stay pure (no React/player/network, no mutation).
- [ ] New behavior adds a `SyncEvent`/`SyncEffect` variant **and** a transition test in `watch-sync-machine.test.ts`.
- [ ] Side effects only run in `use-sync-controller.ts` via returned `effects`.
- [ ] Telemetry flows from `syncTelemetryEvents`, not ad-hoc `track()` calls.
- [ ] Anchor handling routes through `shouldAcceptPlaybackAnchor` (broadcast vs persisted snapshot dedupe preserved).
- [ ] `selectSyncStatus` 3-value contract unchanged; phase logic uses `selectPhase`.
- [ ] `bun run test` (sync suites) and `bun run typecheck` pass.
