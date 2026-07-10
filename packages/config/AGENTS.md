# @pumni/config — package-scoped rules

Package delta; root AGENTS.md applies.

## Summary

Shared monorepo configuration and static constants. This package exports app
metadata from `src/index.ts` and the ESLint flat config from `eslint.mjs`. It has
no runtime secrets and no browser/server side effects.

## Architecture

- `src/index.ts` is for cross-package constants such as app metadata, route maps,
  and feature flags.
- `eslint.mjs` owns local lint policy, including design-token and surface
  boundary messages used by `bun run ai:check`.
- Keep exports stable and framework-light so apps and packages can import config
  without pulling runtime code.

## Stack

TypeScript only for source exports. ESLint flat config for policy. No React,
Next.js, Supabase, auth, or env runtime dependency.

## Commands

- `bun --filter @pumni/config typecheck`
- `bun run ai:check` when changing lint policy or AI-enforced messages

## Pitfalls

- Do not put secrets, environment reads, or service clients here; use
  `@pumni/env` and server-only packages.
- Do not add app-specific imports (`@/`) or package cycles.
- Treat lint messages as part of the enforcement surface; update docs and tests
  when changing them.
