---
name: server-action
description: Build Next.js Server Actions with Zod validation, server-derived auth, and cache invalidation. Use when adding or changing a server-side mutation in features/<feature>/actions.ts, or wiring updateTag/revalidateTag. For client form wiring, use react-hook-form.
---

# Server Action

Use this skill when adding or changing a Next.js Server Action in
`apps/web/src/features/<feature>/actions.ts`. This is the write seam: the form
that calls it is `react-hook-form`; the read it invalidates is
`server-component-read`.

Skeleton: copy [scripts/action.template.ts](/.agents/skills/server-action/scripts/action.template.ts).

## Rules

- Read `apps/web/AGENTS.md` before changing Next.js app code.
- Keep Server Actions in feature modules, not route files. File carries
  `"use server"`.
- Validate input with a schema from `@pumni/validators` (`safeParse`) before any
  write; never write on a parse failure.
- Derive the current user from server auth helpers (`requireUser()`); do not
  trust a client-sent `user_id` as authorization.
- Keep Supabase service-role clients server-only. Add `"server-only"` to modules
  that encapsulate privileged server access.
- Return explicit success/failure shapes or throw typed errors. Do not swallow
  Supabase errors.
- After mutations, use `updateTag(tag)` for fresh read-your-writes behavior or
  `revalidateTag(tag, 'max')` for stale-while-revalidate flows. The tag string
  must match the read's `cacheTag` exactly. Both are Server Action/Component
  only — they throw in a Route Handler.

## Known Failure Modes

| Symptom | Cause | Fix |
|---|---|---|
| Database updates but the user still sees stale data after reload | Missing cache tag invalidation or mismatched tag names | Call `updateTag(tag)` or `revalidateTag(tag, 'max')` with the exact parameterized tag matching the read's `cacheTag` |
| The application throws a runtime error during API request | Cache invalidation helpers called inside a Route Handler | Do not call `updateTag` or `revalidateTag` in `route.ts` handlers (they are only allowed in Server Actions/Components) |
| Cross-user privilege escalation on writes | Trusting client-supplied arguments (e.g. `userId`) for authorization | Derive user ID on the server using `requireUser()` and verify write authorization before updating/inserting |

## Checklist

- [ ] Action lives in `apps/web/src/features/<feature>/actions.ts`.
- [ ] File has `"use server"` where required by the local pattern.
- [ ] Input is validated before database writes.
- [ ] User ownership is derived server-side or enforced by RLS `WITH CHECK`.
- [ ] No service-role or secret key crosses into client-bundle code.
- [ ] Mutation has a cache invalidation or update strategy.
- [ ] `bun run ai:eval` and `bun run typecheck` pass.
