---
name: server-action
description: Build Next.js Server Actions with validation, auth boundaries, and cache invalidation.
---

# Server Action

Use this skill when adding or changing a Next.js Server Action in
`apps/web/src/features/<feature>/actions.ts`.

## Rules

- Read `apps/web/AGENTS.md` before changing Next.js app code.
- Keep Server Actions in feature modules, not route files.
- Validate input with schemas from `@pumni/validators` or a local Zod schema
  before writing.
- Derive the current user from server auth helpers; do not trust a client-sent
  `user_id` as authorization.
- Keep Supabase service-role clients server-only. Add `"server-only"` to modules
  that encapsulate privileged server access.
- Return explicit success/failure shapes or throw typed errors. Do not swallow
  Supabase errors.
- After mutations, use `updateTag(...)` for fresh read-your-writes behavior or
  `revalidateTag(tag, 'max')` for stale-while-revalidate flows.

## Checklist

- [ ] Action lives in `apps/web/src/features/<feature>/actions.ts`.
- [ ] File has `"use server"` where required by the local pattern.
- [ ] Input is validated before database writes.
- [ ] User ownership is derived server-side or enforced by RLS `WITH CHECK`.
- [ ] No service-role or secret key crosses into client-bundle code.
- [ ] Mutation has a cache invalidation or update strategy.
- [ ] `bun run ai:eval` and `bun run typecheck` pass.
