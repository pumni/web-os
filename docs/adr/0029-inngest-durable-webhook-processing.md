# 0029. Inngest Durable Webhook Processing and Reconciliation

- **Status:** Accepted
- **Date:** 2026-07-12
- **Owner:** Engineering Team

## Context

In Phase 1, Polar webhook events were processed synchronously within the Next.js Route Handler. If any database write or side effect (such as revalidating the Next.js cache or inserting audit events) failed, the route returned a `500 Internal Server Error`, prompting Polar to retry the event delivery up to 10 times.

While this synchronous pattern is simple and robust for low-volume traffic, it carries operational risks:
1. **Response Time & Timeouts:** Next.js Route Handlers are subject to serverless execution limits (e.g., Vercel timeouts). Synchronous webhook execution that includes multiple database calls, remote cache invalidations, and analytics events could easily exceed timeouts (especially under load).
2. **Atomic Failures:** If a late step (like recording an audit event) fails, the entire request fails and retries, potentially repeating earlier successful steps (e.g., subscription upsert) unless the code is perfectly idempotent.
3. **Reconciliation Drift:** If webhook events are dropped or delivered out of order by the payment provider, the local database could drift from the upstream payment provider state.

## Decision

We migrate webhook processing to a durable background worker model using **Inngest** and introduce a nightly reconciliation cron job.

Specifically, we decide:
1. **Asynchronous Processing (D1):** If Inngest is configured (`INNGEST_SIGNING_KEY` is present), the webhook Route Handler verifies the signature, inserts the raw event into `webhook_events` to ensure idempotency, enqueues the event to Inngest via `inngest.send()`, and immediately returns a `200 OK` response to Polar.
2. **Durable Steps (D2):** The processing of the webhook is moved to an Inngest background job (`processPolarWebhook`). Each side effect—upserting the subscription/customer status, revalidating the Next.js cache tag, and recording the audit log—is isolated in its own `step.run()` block.
3. **Synchronous Fallback (D3):** If Inngest is not configured (e.g., local development without an Inngest dev server or specific environments), the Route Handler falls back to synchronous processing, maintaining the exact same functional path to ensure ease of testing.
4. **Nightly reconciliation (D4):** We schedule a nightly cron job in Inngest (`nightlySubscriptionReconcile` at `0 2 * * *`) that fetches active subscriptions from Polar, compares them to our local state, and converges the database to match Polar (upserting missing rows, correcting drifted fields, and logging audit logs for changes).

## Consequences

- **Behavioral Shift in Failure Modes:** When Inngest is active, Polar is notified of successful delivery (200) once the event is enqueued. If the handler fails during processing (e.g., database deadlock, cache service down), the retries are managed by Inngest (retrying the specific failed step up to 3 times in the background) rather than Polar.
- **Improved Fault Isolation:** A failure in cache invalidation or audit logging will only retry that specific step rather than repeating the entire subscription upsert.
- **Enhanced Observability:** Failed webhook processing runs can be inspected, debugged, and manually replayed directly from the Inngest dashboard.
- **Resilience to Outages:** Temporary database outages will not cause webhooks to fail permanently or cause Polar to exhaust its retries, as Inngest maintains event queues.

## Alternatives considered

- **Synchronous-only processing:** Rejected because it does not scale well and is highly susceptible to transient network/database timeout errors.
- **Custom BullMQ/Redis Queue:** Rejected because it requires provisioning and maintaining a persistent Redis queue server, whereas Inngest is a serverless-friendly event-driven queue.
