---
description: When and how to use XML tagging and `<thinking>` chain-of-thought for multi-constraint tasks. Risk classification lives in `docs/ai/prompt-playbook.md`.
when-to-load: When a task has many constraints (R2 Supabase/RLS, multi-package, or architecture-touching) and freeform reasoning risks missing one.
last-reviewed: 2026-06-19
---

# Prompt Structure

Optional structure for hard tasks. Most R0 and small R1 prompts are better
written plainly — extra tags add tokens and noise without value. Reach for this
guide when a prompt carries many constraints that are easy to drop.

This complements, and does not replace, the Mini-PRD template in
`docs/ai/prompt-playbook.md`. The Mini-PRD captures *what* and *how to validate*;
the techniques below structure *how to reason and isolate constraints*.

## When to use it

| Situation | Use |
| --- | --- |
| R0 cosmetic / docs / typo | Do not use. Plain prompt. |
| Small R1 (single file, one clear change) | Do not use. Plain prompt. |
| R2 Supabase / RLS / auth / keys | Use. Multiple security + boundary constraints. |
| Multi-package change | Use. Blast-radius reasoning matters. |
| Cache-boundary or App-Router-architecture change | Use. Next.js 16 pitfalls are subtle. |
| Refactor with backward-compat risk | Use `<thinking>` only. |

Rule of thumb: if the change touches more than one file *type* (e.g. migration +
Server Action + client hook), structure it.

## XML tagging

Wrap the prompt into labeled sections so each constraint type is isolated and
easy to verify against. Use the four tags below — do not invent more.

- `<context>` — relevant code paths, file links, the current behavior.
- `<requirements>` — hard constraints (RLS stays default-deny, service-role
  server-only, `await params`, no `any`).
- `<task>` — the concrete change requested.
- `<constraints>` — soft constraints (performance budget, backward-compat,
  packages that must not be touched).

Example shape (do not copy literally; adapt):

```
<context>
apps/web/src/features/<feature>/actions.ts owns the mutation.
RLS on `table_x` is default-deny (see supabase/migrations/...).
</context>

<requirements>
- Keep service-role client server-only (AGENTS.md P0).
- Validate input with Zod before any DB write.
- Return { success: true, data } | { error: string }.
</requirements>

<task>
Add a soft-delete mutation that sets deleted_at and invalidates the list cache.
</task>
```

Keep tags short. The goal is separation, not length. If a tag would hold one
sentence, write the sentence plainly instead.

## `<thinking>` chain-of-thought

Before a non-trivial edit, reason through the following in a `<thinking>` block
(or the equivalent plan-mode step). This is the structured version of "plan
before you edit":

1. **Constraints and assumptions** — which P0–P4 rules bind this change? What am
   I assuming about the current code?
2. **Trade-offs** — what alternative did I reject, and why?
3. **Blast radius** — trace the change across `docs/architecture/project-graph.md`.
   Which edges move? Which dependents must keep compiling?
4. **Backward compatibility** — will existing callers, routes, or cached data
   break? What migration or cache invalidation is required?

Surface this reasoning to the user, then edit. Do not use `<thinking>` to defer
a decision that the priority stack already settles — follow P0–P4 first.

## Few-shot anchors

Prefer referencing real examples over inventing new ones:

- Real local implementations: `docs/ai/golden-examples.md`.
- ❌/✅ mistake pairs (Next.js 16, Supabase, state, routes):
  `docs/ai/common-mistakes.md`.

When you need a fresh example, mirror the style of those files (terse, real
paths, no fictional stack).

## Positive instructions

State the target, not the avoidance. "Return a typed `{ success, data } | { error }`
object" is stronger than "don't leak raw DB errors." The codebase already follows
this in most places — keep it consistent.
