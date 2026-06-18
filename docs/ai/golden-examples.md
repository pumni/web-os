---
description: Real repository examples to inspect before implementing common web-os patterns.
when-to-load: When looking for a local production pattern to copy for feature, Supabase, route, or validation work.
last-reviewed: 2026-06-19
---

# Golden Examples

These are real paths in this repo. Use them as starting points, then still
verify against the canonical convention docs.

## Feature Module

- `apps/web/src/features/profile/actions.ts`: Server Action with Zod validation,
  `requireUser()`, Supabase update, and `updateTag(...)`.
- `apps/web/src/features/profile/profile-form.tsx`: Client form with
  `useMutation`, pending state, optimistic form reset, and error handling.
- `apps/web/src/features/profile/queries.ts`: cached server read with explicit
  projection and user-scoped cache tag. Review server-only and service-role
  boundaries before copying this pattern.

## Supabase

- `supabase/migrations/001_initial_profiles.sql`: table, RLS policies, explicit
  grants, private trigger function, `search_path`, and function execute revoke.
- `supabase/migrations/002_user_settings.sql`: user-owned settings table pattern.
- `supabase/migrations/003_audit_events.sql`: audit/event table pattern.

## App Router

- `apps/web/src/app/auth/callback/route.ts`: small route handler that composes
  framework request/response logic and Supabase auth exchange.
- `apps/web/src/app/(app)/settings/profile/page.tsx`: route segment that should
  remain composition-focused, with feature behavior delegated to the profile
  module.

## Package Boundaries

- `packages/auth/src`: server auth helpers.
- `packages/supabase/src`: Supabase client factories.
- `packages/validators/src`: shared Zod schemas.
- `packages/ui/src`: reusable UI primitives without database or auth logic.

## How To Use

Before copying a pattern:

1. Read the matching task route in `docs/ai/task-routes`.
2. Read the convention doc that owns the pattern.
3. Compare the target task with the example's trust boundary.
4. Run `bun run ai:check` and `bun run ai:eval` after context or policy changes.
