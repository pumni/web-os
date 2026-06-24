---
description: Real repository examples to inspect before implementing common web-os patterns. Use when looking for a local production pattern to copy for feature, Supabase, route, or validation work.
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

## Watch Sync (Realtime)

The active watch-together surface (ADR-0011). See `.agents/skills/watch-sync`
for the architecture rules before copying.

- `apps/web/src/features/watch/sync-machine.ts`: pure follower-lifecycle reducer
  `(state, event) => { state, effects }` plus transition-derived telemetry.
- `apps/web/src/features/watch/sync-math.ts`: pure timing math —
  `calculateExpectedPosition`, `shouldAcceptPlaybackAnchor` (broadcast vs
  persisted-snapshot dedupe), Cristian `selectBestClockSample`.
- `apps/web/src/features/watch/hooks/use-sync-controller.ts`: the thin executor
  that applies reducer effects to the player (only side-effecting layer).
- `apps/web/src/features/watch/hooks/use-server-clock.ts`: min-RTT clock probe.
- `apps/web/src/test/features/watch-sync-machine.test.ts`: transition-by-transition
  test mapping — the template for adding new sync behavior.

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

## Agent Skills

- `.agents/skills/domain-modeling/SKILL.md`: update
  `docs/ai/domain-language.md` when a durable term is clarified.

## How To Use

Before copying a pattern:

1. Use `docs/ai/index.md` to find the convention doc that owns the pattern.
2. Read that convention doc.
3. Compare the target task with the example's trust boundary.
4. Run `bun run ai:check` and `bun run ai:eval` after context or policy changes.
