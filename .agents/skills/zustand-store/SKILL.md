---
name: zustand-store
description: Create Zustand stores for client UI state only, never server data.
---

# Zustand Store

Use this skill when adding or changing a Zustand store in `apps/web/src/stores`
or feature-local UI state.

## Rules

- Read `docs/conventions/data-fetching.md` before adding a store.
- Store only client UI state: panels, dialogs, selected local IDs, draft UI
  controls, optimistic view flags, or toast state.
- Do not store Supabase rows, Query results, authenticated user objects, or data
  that should live in Server Components or TanStack Query.
- Keep store actions small and synchronous unless the local pattern already
  supports async UI actions.
- Do not import server-only modules or Supabase service-role clients.
- Persist only non-sensitive UI preferences, and document why persistence is
  needed.

## Checklist

- [ ] Store state is UI-only.
- [ ] No server data or Query result is copied into the store.
- [ ] Store does not import server-only, auth, or secret modules.
- [ ] Selectors are narrow enough to avoid broad re-renders.
- [ ] Persistence is absent or limited to safe UI preferences.
- [ ] Components still read server data from Server Components or TanStack
      Query.
- [ ] `bun run ai:eval` and `bun run typecheck` pass.
