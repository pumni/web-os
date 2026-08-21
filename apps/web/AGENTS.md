# apps/web — local agent delta

Root `AGENTS.md` applies. This file only adds rules specific to the Next.js app.

## Load when relevant

- For version-sensitive Next.js behavior, read
  `docs/conventions/nextjs-project-profile.md` and inspect the installed Next.js
  docs/source when needed. Prefer repository-local evidence over remembered
  framework behavior.
- For cache/server-state changes, read `docs/conventions/data-fetching.md`.
- For auth, Supabase, or server-secret work, read
  `docs/conventions/supabase-security.md`.

## Structure

- `src/app`: route composition and framework entry points.
- `src/features/<feature>`: domain behavior, feature components, queries,
  actions, and feature-local state.
- `src/shared`: app-local shell, providers, reusable hooks/helpers, and UI glue.
- Routes should consume feature public APIs rather than own domain logic.
- React Compiler is active. Do not add `useMemo`/`useCallback` solely for
  ordinary referential stability; use manual memoization only when a concrete
  boundary requires it.
- Playground/demo surfaces (`src/features/sky-player`,
  `src/features/design-trends`, `src/app/(app)/todos`) may stay lightweight,
  but security boundaries still apply when they touch server resources.

## Validation

Use package-local gates while iterating:

- `bun --filter web lint`
- `bun --filter web typecheck`
- `bun --filter web test`
- `bun --filter web build` for route/config/bundle-affecting changes

Use `bun run verify` for cross-workspace or pre-merge proof.
