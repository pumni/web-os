---
name: watch-sync
description: Maintain the watch-together playback-sync architecture — a pure follower-lifecycle reducer, pure timing math, a thin effect executor, and transition-derived telemetry. Use when changing apps/web/src/features/watch sync code (sync-machine.ts, sync-math.ts, use-sync-controller.ts, use-server-clock.ts, use-room-channel.ts), or touching drift/seek/nudge behavior, anchor acceptance, host/follower roles, or realtime broadcast sync.
---

# Watch Sync

## Authoritative references

- Decision core: `apps/web/src/features/watch/sync-machine.ts`.
- Timing and anchor rules: `apps/web/src/features/watch/sync-math.ts`.
- Effect boundary and transport hooks:
  `apps/web/src/features/watch/hooks/use-sync-controller.ts`,
  `use-server-clock.ts`, and `use-room-channel.ts`.
- Executable transition specification:
  `apps/web/src/test/features/watch-sync-machine.test.ts` and
  `apps/web/src/test/features/watch-sync.test.ts`.
- Architectural rationale: `docs/adr/0011-watch-sync-state-machine-and-observability-seam.md`.

## Non-obvious invariants

- Follower lifecycle decisions stay in the pure reducer; player and network
  side effects run at the controller boundary.
- Anchor acceptance must protect a fresher versioned broadcast from delayed
  persisted snapshots.
- Telemetry derives from `syncTelemetryEvents`; do not hand-place events in the
  controller.
- Preserve the public three-value `selectSyncStatus` contract while using
  `selectPhase` for richer lifecycle state.

## Procedure

1. Read the affected decision core, math, controller, and focused tests before
   changing behavior.
2. Add lifecycle behavior as a typed event/effect and transition tests. Keep
   pure code free of React, player, and network dependencies.
3. Apply effects only in the existing executor and route anchors through the
   tested acceptance predicates.
4. Run the focused watch-sync tests, then the web typecheck/test/build gates as
   the changed surface requires.

## Verification

- `bun --filter web test`
- `bun --filter web typecheck`
- `bun --filter web build` for route/config/bundle-affecting changes
