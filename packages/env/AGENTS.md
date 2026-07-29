# @pumni/env — package-scoped rules

Package delta; root AGENTS.md applies.

## Summary

Zod-validated environment access split into client-safe and server-only entry
points. Browser code may only use publishable `NEXT_PUBLIC_*` values; privileged
keys stay server-only.

## Architecture

- `src/client-schema.ts` defines the browser-safe schema.
- `src/client.ts` parses and exports `clientEnv`.
- `src/server-schema.ts` extends the client schema with server-only secrets.
- `src/server.ts` imports `server-only` and exports `serverEnv`.
- `src/index.ts` intentionally exports only client-safe schema surface.

## Stack

Zod 4 and `server-only`. Consumed by Supabase/auth/server code and client-safe
configuration paths.

## Commands

- `bun --filter @pumni/env typecheck`
- `bun run ai:check`
- `bun run ai:review` when changing secret handling

## Pitfalls

- Never export `serverEnv` from a client-safe barrel or import it into
  `"use client"` files.
- Service-role and secret keys must remain in `src/server.ts` behind `server-only` (security invariant, see [supabase-security.md](../../docs/conventions/supabase-security.md)).
- New browser-visible variables must be prefixed `NEXT_PUBLIC_*` and added to
  the client schema deliberately.
