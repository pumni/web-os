# apps/web — Next.js 16 (nearest-file rules)

This is **not** the Next.js in your training data. APIs, conventions, and file
structure differ. Before writing app code, look up the API in
`node_modules/next/dist/docs/` (or the `nextjs_docs` MCP) — never rely on
training-data knowledge for Next.js 16 specifics.

## Hard rules (SSOT — do not duplicate here)

Canonical: `docs/conventions/nextjs-16.md` — read before writing any Next.js 16 code.

`.claude/rules/nextjs-async-apis.md` and `.claude/rules/nextjs-cache-components.md` are
Claude Code path-scoped pointers (generated tier): they load only when you touch files under
`apps/web/src/app/**` or `apps/web/src/features/**/actions.ts|queries.ts`, and each is a
short reminder with a back-link to the canonical above.

## App-local layout

- Routes in `src/app`; shared shell/providers/UI in `src/shared` (`components`, `hooks`, `lib`, `stores`); domain logic in `src/features/<feature>` (Server Actions in `actions.ts`, queries, feature components/stores).
- State ownership: server data stays in Server Components or TanStack Query cache; never mirror it to Zustand (see [data-fetching.md](../../docs/conventions/data-fetching.md)).
- Server-only modules carry `"server-only"`; the service-role key never reaches
  client bundles (`docs/conventions/supabase-security.md`).
- React Compiler is active monorepo-wide: do not add **new** `useMemo`/`useCallback`
  for ordinary stability. Optimize manually only for `useTransition`, ref cleanup,
  or dynamic third-party JSX props.
- Playground/demo surfaces — `src/features/sky-player`, `src/features/design-trends`,
  `src/app/(app)/todos` — are exempt from full feature-module requirements, but P0
  security mandates (RLS/auth) still apply if they touch any server resource.

For repeated procedures see `.agents/skills/*` (e.g. `server-action`,
`tanstack-query-hook`, `zustand-store`, `ui-styling`).
