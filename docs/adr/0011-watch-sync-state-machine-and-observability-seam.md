# 0011. Watch Sync as an Explicit State Machine + an Observability Seam

- **Status:** Accepted
- **Date:** 2026-06-20
- **Owner:** Watch feature / frontend platform

## Context

The watch-together hub (`apps/web/src/features/watch`) is the project's first
real product feature on top of the OS skeleton (ADR-0010). Its hardest surface is
**playback sync**: keeping N followers aligned to a host across clock skew,
network jitter, autoplay restrictions, manual interaction, host transfers, and
realtime reconnects. An architecture review of that subsystem found two coupled
gaps that are not addressed by any existing ADR or convention.

**Gap 1 — sync is an implicit state machine.** A follower's true state is the
product of several independently-managed variables spread across hooks:

- React state `syncStatus`, `isFollowingHost`, `needsGesture`, `prevIsHost`
  (`hooks/use-sync-controller.ts:70-89`).
- Refs that **mirror** those same states for closure-freshness —
  `isFollowingHostRef`, `needsGestureRef` (`:76,90`) — a dual source of truth.
- Transport/clock states living in sibling hooks: `channelStatus` /
  `wasDisconnectedRef` (`hooks/use-room-channel.ts:32,44`), `ready` /
  `clockOffset` (`hooks/use-server-clock.ts:6-7`).

Transition logic is scattered across ~6 callbacks and 3 effects
(`handleFollowerManualInteraction`, `resync`, `resumeFromGesture`,
`receiveAnchorRef`, the reconcile loop). The pure decision helpers already exist
and are tested-shaped (`classifyDrift`, `calculateExpectedPosition`,
`matchTransportState`, `sync-math.ts`) — but they cover only per-tick drift, not
the lifecycle. The lifecycle itself is imperative and the ref-mirror duplication
is a known bug class.

**Gap 2 — no observability seam.** There is no telemetry, error-reporting, or RUM
surface anywhere in the app. Errors are dropped to `console.error`
(`use-server-clock.ts:33`, `use-host-anchor-emitter.ts:54`) or swallowed by a
hand-rolled inline script (`app/layout.tsx:57`). For a watch product the most
valuable signal is **sync health** — drift magnitude, seek/nudge frequency,
autoplay-gesture rate, reconnect count, clock offset/RTT, host-transfer churn —
none of which is observable today.

**The key finding: these are one refactor, not two.** Once the sync lifecycle is
an explicit machine, every transition is a typed event — which is exactly the
telemetry stream sync health needs. Bolting observability onto imperative code
means sprinkling `track()` calls and drifting from real behavior; deriving it
from the machine's transition log makes telemetry consistent and nearly free.

## Decision

**1. Model sync as an explicit, pure state machine.**
Add `features/watch/sync-machine.ts`: a pure reducer `(state, event) => { state,
effects[] }` with no React, player, or network dependencies, so it is unit-tested
in isolation. It owns the follower lifecycle as finite states — `idle`,
`in-sync`, `catching-up`, `gesture-required`, `detached`, `disconnected` — and a
simpler host lifecycle, driven by typed events (`CLOCK_READY`,
`ANCHOR_RECEIVED`, `DRIFT_TICK`, `MANUAL_INTERACTION`, `RESYNC_CMD`,
`GESTURE_RESUMED`, `CHANNEL_STATUS`, `ROLE_CHANGED`). The reducer returns
**effects** (`seek`, `nudge`, `tryPlay`, `persist`) that a thin executor applies
to the Vidstack player. This extends the existing pure-decision boundary
(`sync-math.ts`) up to the whole lifecycle; it does not rewrite the sync algorithm
— `getDriftThresholds`/`classifyDrift`/`calculateExpectedPosition` stay as-is and
are called *from* the reducer. The dual ref-mirror state collapses to the single
reducer state.

**2. Add a vendor-neutral observability seam, no-op by default.**
Define a `Telemetry` interface (`event(name, attrs)` / `error(err, ctx)`)
provided via React context, defaulting to a no-op implementation. It lives in
`apps/web` (e.g. `src/shared/lib/observability`) — **not** a package yet, mirroring
ADR-0010's "no premature split": promote to `@pumni/observability` only when a
second consumer needs it. Watch emits sync-health events **from the machine's
transition log**, plus `error()` replacing the scattered `console.error` sites
and the inline Vidstack-rejection script. A no-op default keeps zero vendor
lock-in and zero cost until a real sink (Sentry/OTel/analytics) is wired by a
consuming project.

**Co-designed instrumentation set** (derived from transitions, not hand-placed):
`sync.drift`, `sync.seek`, `sync.gesture_required`, `sync.detached`,
`sync.resync`, `channel.reconnect`, `clock.offset`/`clock.rtt`,
`host.transfer`/`host.claim`.

**Sequencing (incremental, behavior-preserving):**

1. Pure reducer + exhaustive tests proving it reproduces current behavior, before
   any wiring.
2. Thin executor; swap `use-sync-controller` internals to drive the reducer while
   keeping its public return shape (player/control handlers) unchanged.
3. Wire the telemetry seam; emit from transitions and replace `console.error`.

Each step ships behind a green `bun run test` with no change to observable sync
behavior.

## Consequences

**Positive:**

- Sync correctness becomes testable as a pure function — drift convergence,
  reconnect, host-flip, gesture recovery are unit tests, not manual repro.
- The ref/state dual-source-of-truth (`isFollowingHost*`, `needsGesture*`)
  collapses to one reducer state, removing a live bug class.
- Observability is derived from transitions, so it cannot drift from behavior;
  sync-health is measurable in production for the first time.
- The seam is vendor-neutral and free until a sink is attached — no lock-in.

**Negative / costs:**

- A reducer + executor split is more indirection than inline callbacks; readers
  must follow event → effect → executor instead of one function. Mitigated by the
  reducer being pure and small.
- The telemetry seam is one more provider in the tree and an authoring contract
  (new transitions should emit). Mitigated by emitting centrally from the machine
  rather than at call sites.
- A real telemetry sink, sampling, and PII review are deferred to the consuming
  project; the seam ships unwired.

**Neutral:**

- No new package is created (seam stays in `apps/web`); token tiers and package
  graph are unchanged.
- `sync-math.ts` pure helpers are unchanged in intent; they are now called from
  the reducer.

## Alternatives considered

- **Adopt XState.** Rejected for now: the lifecycle is small enough for a hand-
  written reducer, and a dependency adds bundle weight and a DSL to learn for one
  feature. The hand-rolled reducer keeps the same testability; re-open if a second
  feature needs orchestration (visualizer/actors) worth the dependency.
- **Leave sync imperative; only add telemetry.** Rejected: hand-placed `track()`
  calls drift from behavior and miss transitions, defeating the main value
  (trustworthy sync-health). The machine is what makes telemetry honest.
- **Adopt a vendor SDK (Sentry/OTel) directly in `apps/web`.** Rejected as the
  first move: it couples the platform skeleton to a vendor before a project has
  chosen one. The no-op seam captures the boundary reversibly (same reasoning as
  ADR-0010's `exports`-namespace-before-package-split).
- **Promote the seam to `@pumni/observability` now.** Rejected as premature: no
  second consumer exists; packaging a guessed interface repeats the mistake
  ADR-0010 avoided. Promote on real divergence.

## References

- `docs/adr/0010-frontend-platform-foundation.md` — platform-skeleton framing and
  the "no premature package split / vendor lock-in" precedent this ADR follows.
- `apps/web/src/features/watch/hooks/use-sync-controller.ts` — the implicit state
  machine this ADR makes explicit.
- `apps/web/src/features/watch/sync-math.ts` — existing pure decision helpers the
  reducer builds on.
- `apps/web/src/features/watch/hooks/use-room-channel.ts`,
  `hooks/use-server-clock.ts`, `hooks/use-host-anchor-emitter.ts` — transport,
  clock, and host-emit sources of the telemetry signals.
- `docs/conventions/data-fetching.md` — state-ownership rules the seam and machine
  must respect (no server state in client stores).
