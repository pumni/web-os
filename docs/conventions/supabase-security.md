---
description: Migration rules — RLS, policies, grants, function search_path, and client key handling.
when-to-load: When writing a Supabase migration, RLS policy, RPC, or touching Supabase keys.
last-reviewed: 2026-06-19
---

# Supabase Security Convention

Supabase migrations must define schema, RLS, policies, and Data API grants
together. Do not rely on project defaults for table exposure.

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

```bash
bun run typecheck
```
