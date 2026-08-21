# @pumni/supabase — package-scoped rules

Package delta; root AGENTS.md applies.

## Summary

Supabase client factories: browser, server, and service-role, plus generated
database types. This package owns the app↔DB contract.

## Architecture

- Public entry points are `.`, `./browser`, `./server`, and `./service-role`.
- `./browser` uses publishable `NEXT_PUBLIC_*` values. `./server` and
  `./service-role` are server-only and cannot enter a `"use client"` module.
- `src/types.ts` is generated; regenerate it after schema changes and then run
  typecheck. It is not a hand-edited source file.

## Commands

- `bun --filter @pumni/supabase typecheck`
- `bun run typecheck` (catches cross-package type drift on generated types)
- `bun run lint` and `bun run typecheck`; run the repository `policy:check` when
  changing secret handling or feature-boundary code

## Pitfalls

- Server clients read private env; only `./browser` reads `NEXT_PUBLIC_*`.
