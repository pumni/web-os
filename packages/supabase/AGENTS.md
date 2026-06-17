# @pumni/supabase — package-scoped rules

Path-scoped contract for `packages/supabase`. Read when editing this package.
Root `AGENTS.md` and `docs/conventions/supabase-security.md` still apply; this
file only adds the package-specific boundary.

## Summary

Supabase client factories: browser, server, and service-role. Plus the generated
database types. This package owns the app↔DB contract.

## Architecture

- Exports: `.` (index), `./browser`, `./server`, `./service-role`.
- `./browser` uses the `NEXT_PUBLIC_*` publishable key.
- `./server` and `./service-role` are server-only and must not be imported by
  any `"use client"` file.
- `src/types.ts` is generated; it is in `.fallowrc.json` ignore lists — do not
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

- The service-role / secret client is **server-only** (P0). Never re-export it
  from a barrel that a client bundle can reach.
- Do not change `./server` or `./service-role` to read client env. Server
  modules read private env; only `./browser` reads `NEXT_PUBLIC_*`.
- This is a foundational block (see `docs/architecture/project-graph.md`):
  `@pumni/auth` and every feature depend on it. A breaking change here has wide
  blast radius.
