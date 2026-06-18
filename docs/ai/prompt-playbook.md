---
description: Risk levels, context budgets, mini-PRD template, and recovery patterns for AI tasks.
when-to-load: When classifying a user prompt, planning a feature, or deciding validation depth.
---

# Prompt Playbook

Classify the task before retrieving broad context. The goal is to read enough to
be correct without turning every prompt into a full-repo audit.

## Risk Levels

### R0: Cosmetic or Docs-Only

Examples: copy tweaks, local style polish, small docs edits, typo fixes.

Default route: `docs/ai/task-routes/r0-ui.md`.

Minimum validation: `bun run ai:check` for AI docs, or a focused command for the
touched package when code changed.

### R1: Feature or App Logic

Examples: new component, feature module, Server Action, TanStack Query hook,
Zustand UI store, app route composition.

Default route: `docs/ai/task-routes/r1-feature.md`.

Minimum validation: `bun run ai:check`, `bun run ai:eval`, plus `bun run
typecheck`. Add `bun run test`, `bun run lint`, or `bun run build` when the
changed surface warrants it.

### R2: Supabase, Auth, Secrets, or RLS

Examples: migrations, policies, grants, Supabase keys, auth helpers, privileged
server clients, RPC functions.

Default route: `docs/ai/task-routes/r2-supabase.md`.

Minimum validation: `bun run ai:check`, `bun run ai:eval`, `bun run typecheck`,
and any migration/type generation command required by the change.

R2 / multi-package: có thể bọc yêu cầu cứng trong `<requirements>` để không sót ràng buộc — không bắt buộc, không lạm dụng cho R0/R1.

## Quick Workflows

### Quick Fix

Use for R0 or very small R1 tasks.

1. Read the route and nearby file.
2. Make the smallest change.
3. Run the narrow validation command.
4. Report changed files and validation.

### R1 Feature Loop

1. Read `docs/conventions/feature-module.md` and
   `docs/conventions/data-fetching.md`.
2. Place code under `apps/web/src/features/<feature>` unless a package boundary
   already exists.
3. Keep route files thin.
4. Put mutations in `actions.ts` and client async state in TanStack Query.
5. Keep Zustand limited to local UI state.
6. Verify with `ai:check`, `ai:eval`, and code gates.

### R2 Security Loop

1. Read `docs/conventions/supabase-security.md`.
2. Confirm whether the change touches client bundle, server-only code, or SQL.
3. Keep service-role access server-only.
4. Put schema, RLS, policies, and grants in the same migration.
5. Verify with `ai:eval`; it must scan real web roots, not React Native paths.

## Mini-PRD Template

Use this before implementing a non-trivial feature:

```md
## Goal

[User-visible outcome]

## Scope

[Files/modules likely touched]

## Data ownership

[Server Component, TanStack Query, Zustand UI state, or Supabase]

## Security

[RLS/auth/key boundary impact]

## Validation

[Commands that prove the change]
```

## Recovery

If validation fails, do not patch around the error. Identify the owner:

- P0/P1 conflict: follow `AGENTS.md` and enforced config.
- Architecture conflict: follow `docs/architecture/overview.md`.
- Server/client conflict: follow `docs/conventions/server-client-boundary.md`.
- Data ownership conflict: follow `docs/conventions/data-fetching.md`.
- Supabase conflict: follow `docs/conventions/supabase-security.md`.

If local evidence disagrees with docs, report the drift and prefer enforced
config or production code until the docs are corrected.
