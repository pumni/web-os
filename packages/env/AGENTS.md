# @pumni/env — package-scoped rules

Package delta; root AGENTS.md applies.

## Summary

Zod-validated environment access split into client-safe and server-only entry
points. Browser code may only use publishable `NEXT_PUBLIC_*` values; privileged
keys stay server-only.

## Architecture

- `src/client-schema.ts` and `src/client.ts` own the browser-safe surface.
- `src/server-schema.ts` extends it; `src/server.ts` imports `server-only` and
  exports `serverEnv`.
- `src/index.ts` intentionally exports only the client-safe surface.

## Pitfalls

- Never export `serverEnv` from a client-safe barrel or import it into a
  `"use client"` file.
- New browser-visible variables use `NEXT_PUBLIC_*` and are added to the client
  schema deliberately.
