---
description: Context budget for normal Next.js feature, route, Server Action, Query, and Zustand work.
when-to-load: When adding or changing app features that are not primarily Supabase schema, auth, or RLS work.
last-reviewed: 2026-06-19
---

# R1 Feature Route

Use this route for normal web feature work in `apps/web/src`, shared UI
composition, Server Actions, TanStack Query hooks, and Zustand UI state.

## Context Budget

Must read:

- `AGENTS.md`
- `apps/web/AGENTS.md` before writing Next.js app code
- `docs/conventions/feature-module.md`
- `docs/conventions/data-fetching.md`
- Nearby production code and tests

May read:

- `docs/conventions/server-client-boundary.md` when adding `"use client"`,
  Server Actions, server-only helpers, route handlers, or env access.
- `docs/architecture/overview.md` when moving logic between `apps/web` and
  `packages`.
- `docs/ai/common-mistakes.md` sections 1, 6, 7, 8, 9, 10, and 11.
- `docs/ai/prompt-structure.md` for multi-constraint or multi-package R1 tasks.
- `.agents/workflows/review-gate.md` before reporting done.
- `docs/ai/agent-behavior.md` → "Subagent delegation" when exploration fans out
  across many files (delegate) vs. a single known file (read directly).

Must not read by default:

- `supabase/migrations`
- React Native or mobile project docs
- Supabase security docs unless the feature changes auth, RLS, migrations, or
  keys

## Validation

Run:

- `bun run ai:check`
- `bun run ai:eval`
- `bun run typecheck`

Add `bun run lint`, `bun run test`, or `bun run build` when the touched code
affects those surfaces.

Escalate to R2 when the feature touches migrations, RLS, Supabase keys, auth
helpers, or privileged server clients.
