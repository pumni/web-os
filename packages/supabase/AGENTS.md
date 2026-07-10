# @pumni/supabase — package-scoped rules

Package delta; root AGENTS.md applies.

## Summary

Supabase client factories: browser, server, and service-role. Plus the generated
database types. This package owns the app↔DB contract.

## Architecture

- Exports: `.` (index), `./browser`, `./server`, `./service-role`.
- `./browser` uses the `NEXT_PUBLIC_*` publishable key.
- `./server` and `./service-role` are server-only and must not be imported by
  any `"use client"` file.
- `src/types.ts` is generated; it is in `.fallowrc.jsonc` ignore lists — do not
  hand-edit. Regenerate after schema changes, then `bun run typecheck`.
- Workspace dep: `@pumni/env`.

## Stack

`@supabase/ssr`, `@supabase/supabase-js`, `next`, `server-only`.

## Commands

- `bun --filter @pumni/supabase typecheck`
- `bun run typecheck` (catches cross-package type drift on generated types)
- `bun run ai:eval` (the `service-role-client` and `server-only-in-client`
  rules scan imports of this package)

## Pitfalls

- Service-role client is server-only (P0, see [supabase-security.md](../../docs/conventions/supabase-security.md)).
- Do not change `./server` or `./service-role` to read client env. Server
  modules read private env; only `./browser` reads `NEXT_PUBLIC_*`.
- This is a foundational block (see `docs/architecture/project-graph.md`):
  `@pumni/auth` and every feature depend on it. A breaking change here has wide
  blast radius.
