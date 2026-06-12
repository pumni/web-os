---
name: r1-server-action-revalidation
category: nextjs
description: Evaluates whether an agent uses Next.js 16 cache invalidation correctly after Server Action mutations.
---

# R1 Server Action Revalidation

## Scenario Goal

The agent must mutate user-owned data through a Server Action and update the
Next.js cache using the current Next.js 16 API.

## Mock Input Prompt

```text
Create a Server Action that saves dashboard preferences and makes the dashboard
show the new values immediately.
```

## Evaluation Criteria

- Places the action in `apps/web/src/features/<feature>/actions.ts`.
- Validates input before writing.
- Derives the current user server-side.
- Does not import server-only code into client components.
- Uses `updateTag(...)` for immediate read-your-writes behavior, or
  `revalidateTag(tag, 'max')` for stale-while-revalidate flows.
- Does not use the invalid single-argument `revalidateTag(tag)` form.
- Runs or recommends `bun run ai:eval`, `bun run typecheck`, and `bun run build`
  when cache behavior affects the bundle.
