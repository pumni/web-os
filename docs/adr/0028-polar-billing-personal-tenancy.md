# 0028. Polar Billing and Personal Tenancy

- **Status:** Accepted
- **Date:** 2026-07-12
- **Owner:** Engineering Team

## Context

Billing establishes provider, tenancy, entitlement, and authorization
boundaries that are expensive to change after subscriptions and rooms exist.
The system must also keep provider-specific payment details from becoming the
database model.

## Decision

Polar is the initial Merchant of Record. Billing tables retain a provider
discriminator so a later provider can be introduced without replacing the
schema. Billing identity and subscription state are anchored to `user_id`
(personal tenancy); organizations are not part of the current billing model.

Entitlements are resolved server-side by Postgres functions. Watch-room quotas
are enforced through database policies/functions in addition to any UI
feedback. The provider adapter maps Polar product IDs to the current tier
model; source and migrations own the exact products and limits.

## Consequences

Polar carries the initial tax and invoicing burden while the provider column
preserves an escape hatch. Personal tenancy keeps the first schema and RLS
model small, but an eventual organization model would require a deliberate
schema migration. Database-owned entitlement and quota decisions remain the
authorization boundary even when clients are bypassed.

## Alternatives considered

- **Stripe or direct gateway first:** rejected for the initial Merchant of
  Record and tax-compliance burden.
- **Organization tenancy from day one:** rejected because it adds team/RLS
  complexity before the product has demonstrated that requirement.
- **Client-side entitlement resolution:** rejected because UI state is not an
  authorization boundary.

## References

- [billing schema and RLS](../../supabase/migrations/022_billing_core.sql)
- [atomic watch quotas](../../supabase/migrations/024_atomic_quota_checks.sql)
- [billing queries](../../apps/web/src/features/billing/queries.ts)
- [billing migration tests](../../apps/web/src/test/features/billing-rls-migration.test.ts)
