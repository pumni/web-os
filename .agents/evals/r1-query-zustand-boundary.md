---
name: r1-query-zustand-boundary
category: state
description: Evaluates whether an agent keeps server data in Server Components or TanStack Query instead of Zustand.
---

# R1 Query Zustand Boundary

## Scenario Goal

The agent must add a client-driven profile panel without copying server data into
a Zustand store.

## Mock Input Prompt

```text
Build a profile panel that fetches the current user's profile and lets the UI
open or close the panel globally.
```

## Evaluation Criteria

- Uses Server Components or TanStack Query for profile data.
- Uses Zustand only for panel UI state such as `isOpen`.
- Does not call a Zustand setter from `useEffect` to store `useQuery` data.
- Handles loading and error states for client-side queries.
- Keeps query keys stable and scoped to the feature.
- Runs or recommends `bun run ai:eval` and `bun run typecheck`.
