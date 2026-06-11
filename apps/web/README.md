# Web App

The Next.js delivery app for the starter. It owns routing, layouts, app shell,
global CSS, route handlers, and feature composition.

## Commands

From the repo root:

```bash
bun run dev
bun run lint
bun run typecheck
bun run test
bun run build
```

From this app folder:

```bash
bun run dev
bun run lint
bun run typecheck
bun run test
bun run build
```

## Routing

- `src/app/(public)` contains unauthenticated pages.
- `src/app/(app)` contains authenticated app pages.
- `src/app/auth` contains auth callback route handlers.
- `src/proxy.ts` refreshes Supabase auth cookies before server rendering.

Protected pages should use `requireUser()` from `@pumni/auth`; do not rely on UI
hides for authorization.

## Feature Pattern

Feature code starts in `src/features/<feature-name>`:

- `queries.ts` for server-side data reads.
- `actions.ts` for server actions and mutations.
- Client components only where interaction is required.
- Shared validation schemas live in `@pumni/validators`.

Use Server Components and Server Actions by default. Use TanStack Query only for
client-driven polling, pagination, realtime, or optimistic updates.

## Supabase

Use the shared clients:

- `@pumni/supabase/browser` in Client Components.
- `@pumni/supabase/server` in Server Components, Server Actions, and Route
  Handlers.
- `@pumni/supabase/service-role` only in server-only administrative code.

Never import service-role code into a Client Component.
