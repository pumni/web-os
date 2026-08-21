# 0011. Watch Sync State Machine and Observability Seam

- **Status:** Accepted
- **Date:** 2026-06-20
- **Owner:** Watch feature / frontend platform

## Context

Playback synchronization must reconcile clock skew, network jitter, autoplay
restrictions, manual interaction, host changes, and realtime reconnects. These
conditions are lifecycle transitions, not independent UI flags. Observability
must describe those same transitions or it will drift from actual behavior.

## Decision

The watch feature models synchronization as a pure reducer in
`apps/web/src/features/watch/sync-machine.ts`. The reducer owns lifecycle
state and returns typed player effects; a thin adapter applies those effects to
Vidstack and realtime integrations. Existing timing decisions remain pure in
`sync-math.ts` and are covered by focused tests.

Telemetry is a vendor-neutral seam in the app. Sync-health events are derived
from reducer transitions, and the default provider is a no-op until a concrete
consumer and sink justify a vendor integration. The seam remains in `apps/web`
until another workspace has a real need for the contract.

## Consequences

The lifecycle is testable without React, player, or network effects. The effect
boundary prevents transport concerns from leaking into timing decisions, and
transition-derived telemetry cannot silently diverge from behavior. A real
telemetry sink, sampling policy, and PII review remain future operational work.

The reducer introduces an event/effect hop for readers, but the trade-off is a
single state owner and deterministic tests for drift, gesture recovery,
reconnect, and host changes.

## Alternatives considered

- **Keep imperative lifecycle callbacks:** rejected because state ownership and
  telemetry would remain scattered across effects and refs.
- **Adopt XState:** deferred because the current lifecycle is small enough for a
  focused reducer and a second orchestration consumer does not exist.
- **Couple the seam to Sentry, OTel, or another vendor:** rejected until a sink
  and its data policy are selected by a real consumer.

## References

- [sync machine](../../apps/web/src/features/watch/sync-machine.ts)
- [sync timing math](../../apps/web/src/features/watch/sync-math.ts)
- [sync controller](../../apps/web/src/features/watch/hooks/use-sync-controller.ts)
- [sync machine tests](../../apps/web/src/test/features/watch-sync-machine.test.ts)
- [data/state ownership](../conventions/data-fetching.md)
