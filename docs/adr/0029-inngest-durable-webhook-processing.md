# 0029. Durable Billing Webhooks and Reconciliation

- **Status:** Accepted
- **Date:** 2026-07-12
- **Owner:** Engineering Team

## Context

Payment webhooks combine an external trust boundary with database writes,
cache invalidation, analytics, and audit records. A synchronous handler can
repeat completed work when a later side effect fails, while dropped or
out-of-order events can leave local subscription state divergent from Polar.

## Decision

The Polar route verifies the signature before any business processing. When
Inngest is configured, it records the provider event id for idempotency,
enqueues a durable event, and returns success after enqueueing. The Inngest
handler isolates subscription/customer updates, cache invalidation, analytics,
audit, and processed-state updates in durable steps.

When Inngest is unavailable, the route uses the synchronous handler as a local
and operational fallback. A scheduled reconciliation job compares provider
subscriptions with provider-scoped local rows and repairs missing or drifted
state. Both paths use the provider discriminator and server-only service-role
access.

## Consequences

Configured environments move retries and step failure isolation out of the
webhook request. The fallback preserves local development and testability.
Reconciliation provides convergence when delivery is delayed, duplicated, or
out of order. The system now depends on the durable worker and its operational
visibility, which is an intentional trade-off for webhook reliability.

## Alternatives considered

- **Synchronous-only processing:** rejected because late side-effect failures
  repeat earlier work and increase timeout/retry risk.
- **A self-hosted queue:** rejected for the initial product because it adds
  operational infrastructure that Inngest already provides.
- **No reconciliation:** rejected because idempotency does not repair dropped or
  out-of-order provider events.

## References

- [Polar webhook route](../../apps/web/src/app/api/webhooks/polar/route.ts)
- [durable handlers](../../apps/web/src/features/billing/jobs/functions.ts)
- [Inngest route](../../apps/web/src/app/api/inngest/route.ts)
- [billing webhook tests](../../apps/web/src/test/features/webhook.test.ts)
- [reconciliation tests](../../apps/web/src/test/features/billing-reconciliation.test.ts)
- [provider event schema](../../supabase/migrations/022_billing_core.sql)
