# Pumni Web OS — repository map

Next.js 16 App Router product in a Bun + Turborepo monorepo. Supabase is the
database/auth boundary; TanStack Query owns client server-state caching; Zustand
owns client UI state; Zod owns shared validation.

## Hard boundaries

- Supabase RLS is the authorization boundary. UI visibility is never access
  control. Canonical rules: `docs/conventions/supabase-security.md`.
- Service-role/secret keys stay server-only. Never import them into client
  bundles. Server-only modules carry `"server-only"`.
- Committed migrations are immutable history; change schema/RLS with a new
  migration.
- Never commit secrets or weaken an established security boundary as an
  implementation shortcut.

## Architecture map

- `apps/web/src/app` composes routes; domain behavior belongs in
  `apps/web/src/features`; app-local shared shell/helpers live in
  `apps/web/src/shared`.
- Server data stays in Server Components or TanStack Query. Do not mirror it
  into Zustand.
- Imports flow from apps to packages. `packages/ui` stays client-safe and has no
  auth/database/domain dependencies.
- Feature slices expose a small `index.ts` API; do not deep-import another
  feature's internals.

## Read just in time

Start with the nearest `AGENTS.md`. Read only references relevant to the task;
plans, research, and archived material are subordinate evidence, not default
instructions.

| Task surface | Read when needed |
|---|---|
| Next.js app | `apps/web/AGENTS.md`, `docs/conventions/nextjs-project-profile.md` |
| Auth / Supabase / RLS | `docs/conventions/supabase-security.md` |
| Data fetching / cache / state | `docs/conventions/data-fetching.md` |
| UI / design system | `packages/ui/AGENTS.md`, `docs/conventions/design-system.md` |
| Migrations | `supabase/migrations/AGENTS.md`, `.agents/skills/supabase-migration/SKILL.md` |
| Testing strategy | `docs/conventions/testing.md` |
| Live Next.js runtime debugging | `docs/ai/mcp.md` |
| Domain procedures | `.agents/skills/` |

When implementation details are unclear, use source, tests, types, manifests,
and installed framework behavior as the current source of truth.

## Validation path

Bun only. Start with the narrowest proof and escalate with the change surface:

- Workspace gate: `bun --filter <workspace> lint`, `typecheck`, or `test`.
- Web bundle / route behavior: `bun --filter web build`.
- Context/docs integrity: `bun run context:lint` and `bun run docs:lint`.
- Security / architecture guard changes: `bun run policy:check`.
- Cross-workspace or pre-merge proof: `bun run verify`.

Do not run `npm`, `pnpm`, or `yarn`.
