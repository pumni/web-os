---
description: Tenancy, webhook trust boundaries, quota invariants, and identity rules for the personal billing platform.
---

# Billing Conventions

## Architecture & Tenancy
- **Tenancy**: Personal (per-user) billing via Polar. See [ADR-0028](../adr/0028-polar-billing-personal-tenancy.md).
- **Webhook trust boundary**: The Polar route validates the raw body and
  headers before accepting the event. Idempotency is keyed on the provider
  event id. When `INNGEST_SIGNING_KEY` is configured, durable processing and
  reconciliation run through Inngest. When it is absent, the route uses the
  synchronous handler for local/test operation. Ownership is
  split across the [signature boundary](../../apps/web/src/app/api/webhooks/polar/route.ts),
  [synchronous processing](../../apps/web/src/features/billing/webhook-handlers.ts),
  and [durable jobs](../../apps/web/src/features/billing/jobs/functions.ts).
  See [ADR-0029](../adr/0029-inngest-durable-webhook-processing.md).

## Quotas & Data Integrity
- **Quota invariant**: Plan-quota checks are atomic in Postgres (using
  `pg_advisory_xact_lock` + `volatile` functions). Never re-implement quota
  prechecks in app code. The migration and concurrency contract is covered by
  `apps/web/src/test/features/billing-rls-migration.test.ts`.

- **Upsert identity rule**: `billing_customers` conflicts on `user_id`; webhook
  handlers and their focused tests are the executable examples.
- **Data boundary**: RLS remains the data boundary for `billing_*` tables. `docs/conventions/supabase-security.md` owns the how.

## Environment Variables
- Reference Env keys by name only (`POLAR_*`, `INNGEST_*`, `UPSTASH_*`). They are server-only.
