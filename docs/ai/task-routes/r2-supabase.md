---
description: Context budget for Supabase migrations, RLS, auth, keys, RPCs, and privileged server access.
when-to-load: When a task touches Supabase schema, policies, grants, auth helpers, service-role keys, or RLS behavior.
---

# R2 Supabase Route

Use this route for database, auth, RLS, RPC, grants, generated types, or
Supabase key handling.

## Context Budget

Must read:

- `AGENTS.md`
- `docs/conventions/supabase-security.md`
- `docs/conventions/server-client-boundary.md`
- Relevant migrations under `supabase/migrations`
- Relevant Supabase client/auth helpers under `packages`
- `docs/ai/common-mistakes.md` sections 2, 3, 4, and 5

May read:

- `docs/architecture/overview.md` when package ownership is unclear.
- `docs/conventions/data-fetching.md` when the DB change affects reads,
  mutations, cache invalidation, or generated types.
- `.agents/workflows/review-gate.md` before reporting done.

Must not do:

- Do not bypass RLS.
- Do not put service-role or secret keys in client-bundle code.
- Do not trust client-supplied `user_id` writes as the authorization boundary.
- Do not port React Native edge/function assumptions into this web repo.

## Validation

Run:

- `bun run ai:check`
- `bun run ai:eval`
- `bun run typecheck`

Also regenerate Supabase types and run any migration-specific verification when
the schema changes.
