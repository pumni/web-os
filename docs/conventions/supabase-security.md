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

- Do not place `security definer` functions in exposed schemas.
- Prefer a private schema for privileged helper functions.
- Set an explicit `search_path`.
- Revoke execute from `public`, `anon`, and `authenticated` unless the function is
  intentionally callable through the Data API.

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

The Supabase service-role/secret key must only be used in designated server-only modules that require bypassing Row Level Security (RLS) for system-level operations. The approved module list is machine-enforced as `service-role-import-allowlist` (`ALLOWED_SERVICE_ROLE_MODULES` in `scripts/review-gate-rules.mjs`) — that constant is the single source of truth; extending it is an ask-first change.
