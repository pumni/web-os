---
description: Next.js project profile — project decisions, compiler settings, caching configuration, and local boundaries.
---

# Next.js Project Profile

> **Framework API Reference**: For framework APIs, consult installed package docs in `node_modules/next/dist/docs/` or current Next.js documentation. This profile captures project-specific configurations and architectural decisions only.

## Project decisions

The exact Next.js/React versions are owned by the workspace manifests. The
project-specific flags and route headers are owned by
`apps/web/next.config.ts`; inspect that file before relying on version-sensitive
behavior. The current app enables the React Compiler and Cache Components.

## Architecture Invariants & Boundaries

1. Route files under `apps/web/src/app/` compose feature APIs and shared UI;
   domain behavior belongs in `apps/web/src/features/`.
2. Server-only modules carry `"server-only"`. Route-segment config belongs to
   route files. `'use cache'` is server-side only and may apply at supported
   Server Component or server-function scopes; verify its placement and cache
   semantics against the installed Next.js docs/source.
3. Server state uses Server Components or TanStack Query; Zustand remains client
   UI state. See `docs/conventions/data-fetching.md` for the ownership split.

For framework semantics, read the installed Next.js docs/source in
`node_modules/next/` after checking the project config. Use
`bun --filter web lint`, `typecheck`, and `build` according to the changed
surface.
