---
name: web-feature
description: Create or extend a vertical feature slice under apps/web/src/features/<feature> with the correct split of server reads, Server Actions, client components, forms, Zod validators, and Zustand UI state. Use when starting a new feature slice or adding actions/queries/forms to an existing feature.
---

# Web Feature Module

Scaffold or extend a vertical feature slice (`apps/web/src/features/<feature>`) following Pumni Web OS data-fetching and architecture boundaries.

## Rules

1. **Feature Scope**: Domain logic lives in `features/<feature>` vertical slices behind `index.ts`. Routes in `src/app` compose UI components only.
2. **Server Reads**: Fetch request-scoped data in `queries.ts` or Server Components using `'use cache'` and parameterized `cacheTag`.
3. **Server Actions**: Mutations in `actions.ts` validate inputs with Zod, verify server auth (`requireUser`), and revalidate tags (`updateTag`).
4. **Forms**: Client forms (`*-form.tsx`) use `react-hook-form` + `zodResolver` calling a Server Action.
5. **State Separation**: Server state stays in TanStack Query or Server Components. Zustand stores hold client UI state only.

## Checklist

- [ ] Feature exported behind public `index.ts` API.
- [ ] Server Action input validated with Zod and auth checked with `requireUser()`.
- [ ] Zustand stores contain client UI state only (no server data mirror).
- [ ] `bun run lint` && `bun run typecheck` pass cleanly.
