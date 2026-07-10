---
name: zustand-store
description: Create Zustand stores scoped to client UI state only (`docs/conventions/data-fetching.md`). Use when adding or changing a store for panels, dialogs, selection, or draft UI controls in apps/web/src/shared/stores or feature-local state. For server-derived data, use tanstack-query-hook.
---

# Zustand Store

Use this skill when adding or changing a Zustand store in `apps/web/src/shared/stores`
or feature-local UI state.

## Rules

**Boilerplate:** Copy `.agents/skills/zustand-store/scripts/store.template.ts` → `shared/stores/<name>-store.ts` or `features/<feature>/<name>-store.ts`, then replace `__` placeholders.

- Read `docs/conventions/data-fetching.md` before adding a store.
- Store only client UI state: panels, dialogs, selected local IDs, draft UI
  controls, optimistic view flags, or toast state.
- Do not store Supabase rows, Query results, authenticated user objects, or data
  that should live in Server Components or TanStack Query. State ownership:
  `docs/conventions/data-fetching.md`.
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

## Known Failure Modes

| Symptom | Cause | Fix |
|---|---|---|
| Unnecessary re-renders | Components subscribe to the entire store instead of a narrow selector. | Use `useStore(state => state.value)` to scope the subscription. |
| Stale "server" data | Store holds a copy of server data that drifted from the DB or Query cache. | Delete the mirror; read from `useQuery` or Server Components. |
| Persistence bloat | Sensitive or massive data saved to `localStorage` via the persist middleware. | Limit persistence to simple booleans/strings for UI state only. |
