---
description: High-signal architectural & design failure modes (honor system / non-machine-enforced). Use before designing features or complex database operations.
---

# Common Architectural Pitfalls

> `bun run policy:check` provides defense-in-depth for secret exposure and the
> feature-boundary characterization. TypeScript, ESLint, the Next.js build, and
> focused database/feature tests own the corresponding architecture and security
> contracts. This document covers design-level patterns that still require
> human/agent judgment.

## 1. Premature Abstraction (Simplicity)

❌ Creating a strategy pattern, factory, registry, or multi-tier interface for a single concrete implementation.
✅ Write the minimal clean code for today's requirement. Introduce abstractions only when a second distinct caller or implementation actually exists.

## 2. Upsert Conflict Target vs Row Identity

❌ Specifying `onConflict: 'provider,provider_customer_id'` when the primary key or row identity is `user_id` — changing a provider ID hits the primary key constraint instead of updating the existing row, causing Postgres error `23505`.
✅ Target the unique column that identifies the row identity (`onConflict: 'user_id'`).

## 3. Non-Atomic Quota & Concurrency Checks

❌ Running a `STABLE` function to count rows (`count < limit`) followed by an insert — concurrent requests read the same snapshot and bypass the quota limit.
✅ Acquire `pg_advisory_xact_lock` on the contended key and mark helper functions `VOLATILE` so the recount reads committed transactions.
