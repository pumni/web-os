---
name: tanstack-query-hook
description: Build client TanStack Query reads and mutations without leaking server state into Zustand. Use when adding client-driven async fetching, pagination, optimistic updates, or query-cache invalidation in a feature module.
---

# TanStack Query Hook

Use this skill for client-driven async reads, pagination, optimistic updates, or
mutations in `apps/web/src/features/<feature>`.

## Rules

- Read `docs/conventions/data-fetching.md` before adding query or mutation
  hooks.
- Use this skill only for client-driven async. For initial request-scoped server
  reads use `server-component-read` (Server Component + `'use cache'`); reach for
  a query hook only when the interaction needs client async behavior.
- Define stable query keys close to the feature.
- Components using `useQuery` must handle loading and error states.
- Mutations must invalidate, refetch, or update the relevant query cache.
- Do not mirror query results into Zustand. Zustand is for UI state only.
- Keep browser Supabase clients on publishable keys only.

## Checklist

- [ ] Hook is inside the owning feature module.
- [ ] Query key includes every input that changes the result.
- [ ] Query function returns explicit typed data shape.
- [ ] UI handles `isLoading` or `isPending`.
- [ ] UI handles errors or failure fallback.
- [ ] Mutation has `onSuccess` or `onSettled` cache handling.
- [ ] No `useEffect` copies query data into a Zustand setter.
- [ ] `bun run ai:eval` and `bun run typecheck` pass.
