---
name: web-feature
description: Create or extend a vertical feature slice under apps/web/src/features/<feature> with the correct split of server reads, Server Actions, client components, forms, Zod validators, and Zustand UI state. Use when starting a new feature slice or adding actions/queries/forms to an existing feature.
---

# Web Feature Module

Scaffold or extend a vertical feature slice (`apps/web/src/features/<feature>`) following Pumni Web OS data-fetching and architecture boundaries.

## Rules

1. **Feature Scope**: Domain logic lives in `features/<feature>` vertical slices behind `index.ts`. Routes in `src/app` compose UI components only.
2. **Server Reads**: Standard Server Components are default for initial reads. Use `'use cache'` and `cacheTag` only when data is safe to reuse across requests.
3. **Server Actions**: Mutations in `actions.ts` validate inputs with Zod and verify server auth (`requireUser`). Call `updateTag` when the mutation invalidates cached server data.
4. **Forms**: Use React Hook Form + Zod for forms with validation or interactive state. Small/simple inputs may use native forms or direct Server Actions.
5. **State Separation**: Server state stays in Server Components or TanStack Query. Create a Zustand store only when client UI state needs to be shared or persisted (never mirror server data).

## Checklist

- [ ] Feature exported behind public `index.ts` API.
- [ ] Server Action inputs validated with Zod and auth checked with `requireUser()`.
- [ ] Caching and tag revalidation applied conditionally where data reuse occurs.
- [ ] Zustand stores contain client UI state only (no server data mirror).
- [ ] `bun run lint` && `bun run typecheck` pass cleanly.
