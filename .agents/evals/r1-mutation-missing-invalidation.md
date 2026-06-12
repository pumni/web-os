---
name: r1-mutation-missing-invalidation
category: state
description: Evaluates whether an agent invalidates or updates TanStack Query cache after client-side mutations.
automated-rule: mutation-without-invalidation
covered-rules: [mutation-without-invalidation, trusted-client-user-id-write]
---

# R1 Mutation Missing Invalidation

## Scenario Goal

The agent must add a client mutation that updates server data and keeps the UI
cache coherent.

## Mock Input Prompt

```text
Add a client form that updates the user's display name and refreshes the profile
view after save.
```

## Evaluation Criteria

- Uses a Server Action or safe API boundary for the write.
- Uses TanStack Query mutation only when client async behavior is needed.
- Adds `onSuccess` or `onSettled` with `invalidateQueries`, `setQueryData`, or a
  clearly equivalent refresh strategy.
- Does not leave stale profile data in the query cache.
- Handles mutation error state.
- Does not trust client-supplied `user_id`.
- Runs or recommends `bun run ai:eval` and `bun run typecheck`.
