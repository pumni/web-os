---
description: Migration rules — RLS, policies, grants, function search_path, and client key handling. Use when writing a Supabase migration, RLS policy, RPC, or touching Supabase keys.
---

# Supabase Security Convention

Supabase migrations must define schema, RLS, policies, and Data API grants
together. Do not rely on project defaults for table exposure.

## Migrations

All migrations under `supabase/migrations/` must follow these rules:

- **Immutability:** Existing SQL migration files are historical records and must never be modified once committed or deployed. Any schema, RLS, policy, or permission changes must be written as a new migration file with an incremented prefix (e.g., `021_<name>.sql`).
- **Cohesiveness:** Put the schema table creation, RLS enablement, policies, and Data API grants together in the same migration file.

## Tables

For every table in an exposed schema:

- Enable RLS in the same migration that creates the table.
- Add policies for the real access model.
- Revoke default access from `anon` and `authenticated`.
- Grant the minimum required privileges back to `authenticated`.
- Avoid `anon` grants unless the table is intentionally public.

## Functions

- Privileged implementation helpers belong in a private schema.
- A `security definer` function may exist in an exposed schema only as an
  intentional RPC boundary. It must set an explicit `search_path`, revoke
  execute from `PUBLIC`, `anon`, and `authenticated`, grant only the required
  role, and have focused authorization tests. The billing entitlement wrapper
  in [022_billing_core.sql](../../supabase/migrations/022_billing_core.sql) is
  this kind of service-role-only boundary.
- Revoke execute from `PUBLIC`, `anon`, and `authenticated` unless the function
  is intentionally callable through the Data API.
- Quota functions that count rows must serialize the contended key with
  `pg_advisory_xact_lock` and use `volatile` semantics so concurrent requests
  cannot pass the same snapshot. The focused billing migration test owns this
  contract.

## Client Keys

- Browser code must use the Supabase publishable key only.
- Service role or secret keys must remain server-only.
- `NEXT_PUBLIC_*` variables are public by definition in Next.js.

## Generated Types

Regenerate `packages/supabase/src/types.ts` after schema changes and run:

```pwsh
bunx supabase gen types typescript --local > packages/supabase/src/types.ts
bun run typecheck
```

Never hand-edit the output. See `packages/supabase/AGENTS.md` for generation rules.

## Service-Role Key Exceptions

The Supabase service-role/secret key must only be used in modules that import
`server-only` and genuinely require an RLS bypass for a system-level operation.
Keep user identity derived on the server and preserve an explicit user filter
when a service-role read serves user-owned data. Next.js server-only/build
checks protect the module boundary. The exact service-role import allowlist is
owned mechanically by the ESLint boundary in `apps/web/eslint.config.mjs`, and
its approved/denied behavior is covered by a focused architecture test. Focused
feature and migration tests protect authorization and data-integrity behavior.
A new service-role use requires changing that allowlist and adding a focused
authorization test; `bun run policy:check` is not SQL/RLS/RPC proof.

## Verification ownership

| Invariant | Mechanical/current owner | Proof |
|---|---|---|
| Service-role imports | `apps/web/eslint.config.mjs` | `service-role-boundary.test.ts` plus web lint |
| Server/client secret isolation | `server-only` markers and Next.js build | `bun run verify` |
| RLS, policies, grants, and RPC safety | `apps/web/src/test/features/billing-rls-migration.test.ts`, `watch-rls-migration.test.ts` | `bun run test` |
| Atomic quota enforcement | Focused quota migration tests | `bun run test` |
| Secret exposure defense in depth | `scripts/check-secrets.mjs` | `bun run policy:check` |

`policy:check` is not a substitute for the focused SQL/RLS/RPC tests. When a
schema change updates generated types, the migration skill owns the
regeneration and affected workspace typecheck workflow.
