---
name: r1-server-action-revalidation
category: nextjs
description: Evaluates whether an agent uses Next.js 16 cache invalidation correctly after Server Action mutations.
automated-rule: server-action-missing-revalidation
covered-rules: [server-action-missing-auth, server-action-missing-revalidation, swallowed-error, route-business-logic, cache-life-too-short, cache-tag-unparameterized]
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
- Does not swallow Supabase write errors.
- Does not import server-only code into client components.
- Does not implement the mutation directly inside an `app/` route or page file.
- Uses `updateTag(...)` for immediate read-your-writes behavior, or
  `revalidateTag(tag, 'max')` for stale-while-revalidate flows.
- Does not use the invalid single-argument `revalidateTag(tag)` form.
- Does not use `cacheLife('seconds')` — it punches a dynamic hole in the PPR
  static shell; uses `'minutes'` minimum.
- Parameterizes `cacheTag(...)` with an identifying value (e.g.
  `cacheTag(\`profile:${userId}\`)`) to avoid cross-user cache collisions.
- Runs or recommends `bun run ai:eval`, `bun run typecheck`, and `bun run build`
  when cache behavior affects the bundle.
