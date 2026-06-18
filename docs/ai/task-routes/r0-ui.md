---
description: Context budget for cosmetic UI, copy, and low-risk docs-only tasks.
when-to-load: When a task is local, cosmetic, or documentation-only and does not touch data/auth/security behavior.
last-reviewed: 2026-06-19
---

# R0 UI Route

Use this route for typo fixes, small UI copy changes, local visual polish, and
small docs edits.

## Context Budget

Must read:

- `AGENTS.md`
- `docs/ai/index.md`
- The nearby file being edited

May read:

- `docs/conventions/feature-module.md` if changing component placement.
- `docs/ai/common-mistakes.md` section 8 if touching TanStack Query loading UI.
- `docs/quality-gates.md` if validation scope is unclear.

Must not read by default:

- `supabase/migrations`
- `docs/conventions/supabase-security.md`
- Broad architecture docs, unless the change crosses a package or route boundary.

## Validation

- AI docs: `bun run ai:check`.
- UI code: run the narrow app/package command if available; otherwise use
  `bun run typecheck`.

Escalate to R1 when the change adds state, data fetching, route behavior, or a
new feature module.
