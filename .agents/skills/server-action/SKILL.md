---
name: server-action
description: Build Next.js Server Actions with Zod validation, server-derived auth, and cache invalidation. Use when adding or changing an action in features/<feature>/actions.ts, handling a form mutation, or wiring updateTag/revalidateTag.
---

# Server Action

Use this skill when adding or changing a Next.js Server Action in
`apps/web/src/features/<feature>/actions.ts`. This is the write seam: the form
that calls it is `react-hook-form`; the read it invalidates is
`server-component-read`.

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

## Checklist

- [ ] Action lives in `apps/web/src/features/<feature>/actions.ts`.
- [ ] File has `"use server"` where required by the local pattern.
- [ ] Input is validated before database writes.
- [ ] User ownership is derived server-side or enforced by RLS `WITH CHECK`.
- [ ] No service-role or secret key crosses into client-bundle code.
- [ ] Mutation has a cache invalidation or update strategy.
- [ ] `bun run ai:eval` and `bun run typecheck` pass.
