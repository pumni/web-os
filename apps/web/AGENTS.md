# apps/web — Next.js 16 (nearest-file rules)

This is **not** the Next.js in your training data. For framework API semantics, consult the installed Next.js documentation in `node_modules/next/dist/docs/` or the `nextjs_docs` MCP.

## Project Profile & Conventions

Canonical: `docs/conventions/nextjs-project-profile.md` — read before writing any Next.js code in `apps/web`.

## App-local layout

- Routes in `src/app`; shared shell/providers/UI in `src/shared` (`components`, `hooks`, `lib`, `stores`); domain logic in `src/features/<feature>` (Server Actions in `actions.ts`, queries, feature components/stores).
- State ownership: server data stays in Server Components or TanStack Query cache; never mirror it to Zustand (see [data-fetching.md](../../docs/conventions/data-fetching.md)).
- Server-only modules carry `"server-only"`; the service-role key never reaches client bundles (`docs/conventions/supabase-security.md`).
- Use `"use client"` only for browser interactivity; keep server-only modules and
  route-segment configuration in Server Components. Request-time APIs and route
  props follow `docs/conventions/nextjs-project-profile.md`.
- React Compiler is active monorepo-wide: do not add **new** `useMemo`/`useCallback` for ordinary stability. Optimize manually only for `useTransition`, ref cleanup, or dynamic third-party JSX props.
- Playground/demo surfaces — `src/features/sky-player`, `src/features/design-trends`, `src/app/(app)/todos` — are exempt from full feature-module requirements, but security mandates (RLS/auth) still apply if they touch any server resource.

For domain-specific procedures see `.agents/skills/*` (`watch-sync`, `supabase-migration`).
