# @pumni/validators — package-scoped rules

Path-scoped contract for `packages/validators`. Read when editing shared input
schemas. This package is shared across client and server boundaries.

## Summary

Framework-agnostic Zod schemas and inferred TypeScript input types for auth,
profile, and watch workflows.

## Architecture

- Feature schemas live in small files under `src/` and are re-exported from
  `src/index.ts`.
- Schemas must be deterministic and side-effect free.
- Keep validation close to user/input shape; authorization remains in server/RLS
  owners, not in this package.

## Stack

Zod 4 and TypeScript. No React, Next.js, Supabase clients, auth helpers, env
access, or test-runner dependencies.

## Commands

- `bun --filter @pumni/validators typecheck`
- `bun run typecheck` when consumers depend on changed inferred types

## Pitfalls

- Do not import server-only modules or app aliases (`@/`).
- Do not perform database reads, auth checks, or policy decisions here.
- Be careful changing exported schema names or inferred types; consumers may use
  them across Server Actions, forms, and tests.
