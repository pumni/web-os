---
description: Tenancy, webhook trust boundaries, quota invariants, and identity rules for the personal billing platform.
---

# Billing Conventions

## Architecture & Tenancy
- **Tenancy**: Personal (per-user) billing via Polar. See [ADR-0028](../adr/0028-polar-billing-personal-tenancy.md).
- **Webhook trust boundary**: Signature verification happens before any handler; idempotency is keyed on provider event id. We use durable processing via Inngest with a synchronous fallback. See [ADR-0029](../adr/0029-inngest-durable-webhook-processing.md) and golden example `apps/web/src/features/billing/webhook-handlers.ts`.

## Quotas & Data Integrity
- **Quota invariant**: Plan-quota checks are atomic in Postgres (using `pg_advisory_xact_lock` + `volatile` functions, e.g. `supabase/migrations/024_atomic_quota_checks.sql`). Never re-implement quota prechecks in app code. See [common-mistakes.md](../ai/common-mistakes.md) §15–16.

- **Upsert identity rule**: `billing_customers` conflicts on `user_id`.
- **Data boundary**: RLS remains the data boundary for `billing_*` tables. `docs/conventions/supabase-security.md` owns the how.

## Environment Variables
- Reference Env keys by name only (`POLAR_*`, `INNGEST_*`, `UPSTASH_*`). They are server-only.
