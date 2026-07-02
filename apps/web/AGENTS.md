# apps/web — Next.js 16 (nearest-file rules)

This is **not** the Next.js in your training data. APIs, conventions, and file
structure differ. Before writing app code, look up the API in
`node_modules/next/dist/docs/` (or the `nextjs_docs` MCP) — never rely on
training-data knowledge for Next.js 16 specifics.

## Hard rules live in glob-auto-loaded files (SSOT — do not duplicate here)

When you open App Router pages, layouts, route handlers, or feature
query/action files, these load automatically — read them:

- `.claude/rules/nextjs-async-apis.md` — `params`/`searchParams`/`cookies()`/`headers()`/`draftMode()` are async; `await` them. Generate `PageProps`/`RouteContext` with `npx next typegen`.
- `.claude/rules/nextjs-cache-components.md` — `'use cache'` placement, `cacheLife()` minimums, parameterized `cacheTag()`, `updateTag()` (Server Actions only), two-arg `revalidateTag()`, `<Suspense>` boundaries.

## App-local layout

- Routes in `apps/web/src/app`; reusable UI in `components`; domain logic in
  `features/<feature>` (Server Actions in `actions.ts`, Query hooks, schemas).
- State ownership: server data stays in Server Components or TanStack Query cache; never mirror it to Zustand (see [data-fetching.md](../../docs/conventions/data-fetching.md)).
- Server-only modules carry `"server-only"`; the service-role key never reaches
  client bundles (`docs/conventions/supabase-security.md`).

For repeated procedures see `.agents/skills/*` (e.g. `server-action`,
`tanstack-query-hook`, `zustand-store`, `ui-styling`).
