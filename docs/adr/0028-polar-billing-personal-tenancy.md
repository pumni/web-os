# 0028. Polar Billing and Personal Tenancy for SaaS Platform

- **Status:** Accepted
- **Date:** 2026-07-12
- **Owner:** Engineering Team

## Context

We are introducing paid features to the Pumni Web OS. To implement SaaS billing, we must lock in several foundational architectural choices regarding payment provider selection, tier packaging, data tenancy model, and the first gated feature set. These choices will establish hard constraints on our schema design and operational workflow.

The core forces acting on these decisions are:
1. **VAT/Global Taxes:** Handling global taxes, invoice generation, and financial compliance is a significant operational burden, especially for a Vietnam-based developer/entity.
2. **Tenancy & Schema Complexity:** Introducing a multi-tenant organization structure adds schema and query complexity (joins, team-scoped RLS).
3. **Packaging Drift:** The billing provider's product configurations (prices, tier structures) must match our internal Postgres policies without causing hard-to-maintain drift.

## Decision

We make the following four unified decisions (D1–D4):
1. **Payment Provider (D1):** We select **Polar** as our Merchant of Record (MoR) to offload VAT/tax calculations and global invoicing. However, the database schema remains provider-agnostic via a `provider` discriminator column (e.g. `'polar'`) so that PayOS or direct Vietnamese payment gateways can be integrated later without a major schema rewrite.
2. **Packaging (D2):** We define three tiers: `free`, `pro`, and `max`, with monthly and yearly pricing options. The entitlements (capabilities and numeric limits) are resolved on the server-side via Postgres functions from the active tier.
3. **Tenancy (D3):** We adopt a **Personal Tenancy** model where subscription state anchors directly on `user_id`. There is no organizations table or team membership mapping in the billing layer.
4. **First Gated Feature (D4):** We gate watch-rooms. The `free` tier is capped on active rooms owned and members per room. The `pro` tier increases these limits, and the `max` tier is completely uncapped. These quotas are enforced directly via Postgres RLS policies and functions (RPC) rather than relying solely on UI hides.

## Consequences

- **Tax Offloading:** Polar handles VAT/tax compliance and invoicing globally, removing a significant regulatory burden.
- **Provider Agnosticism:** We must always query and write to the database using the `provider` discriminator, avoiding vendor lock-in.
- **Organization Migration Risk:** Adopting a personal tenancy model means that introducing team/organization-level billing in the future will require a significant database schema migration to map rooms to organization IDs rather than direct user IDs.
- **Postgres-Enforced Security:** Enforcing quotas at the database level guarantees security (defense-in-depth) even if client-side validation is bypassed, but requires mapping Postgres RLS rejection codes (`42501`) to user-friendly messages in the application layer.

## Alternatives considered

- **Stripe:** Rejected because Stripe does not act as a Merchant of Record, meaning we would have to handle VAT tax registration and filings ourselves globally.
- **Organization Tenancy from Day 1:** Rejected because it introduces premature complexity (organization management, invitation flows, complex RLS joins) before proving the value of the paid watch-room features.
- **Client-Side Entitlement Resolution:** Rejected because it is trivial to bypass. Entitlements and tier checks must live in the database as the Single Source of Truth (SSOT).
