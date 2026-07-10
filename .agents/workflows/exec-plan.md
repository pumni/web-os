# ExecPlan

A living document for tracking multi-step tasks. **Advisory** - use when work
spans more than three files, takes more than ~1 hour, or has a compatibility
risk that needs an explicit decision log.

## When to use

Create an ExecPlan when the task:
- Touches 3+ files across different modules or packages.
- Has multiple sequential phases where earlier phases must be verified before later ones begin.
- Carries a compatibility risk (changed public API, schema, wire protocol).
- Has been given back after a stale context - the plan re-orients without re-reading the full transcript.

Skip for single-file fixes, pure docs/context edits, or trivial follow-ups.

## Template

Copy the block below into your working artifact or a scratch file; update in
place as you execute.

````markdown
# ExecPlan: <Task title>

**Goal:** One sentence - what done looks like.
**Scope:** Files / packages touched. Explicit do-not-touch list.
**Gate:** The narrowest `bun run` command that proves the change (from the root `AGENTS.md` validation gates).

## Steps

- [ ] Step 1 - description + completion criterion
- [ ] Step 2
- [ ] ...

## Progress

<!-- Update as you go. One line per completed step: what happened, any surprise. -->

## Decision Log

<!-- Immutable. Date + decision + rationale. Add; never delete. -->
| Date | Decision | Rationale |
|---|---|---|

## Outcomes & Retrospective

<!-- Fill after Done. What went well, what to add to common-mistakes.md. -->
````

## Integration with review-gate

When closing an ExecPlan, run `review-gate` (`.agents/workflows/review-gate.md`)
before reporting the task done. The retrospective section is the input for any
new `common-mistakes.md` entry.

## Compatibility risk rule

Call out a compatibility concern **only** when the change affects:
- Behavior shipped in the latest released tag (not unreleased branch churn).
- A persisted schema, wire protocol, CLI flag, or env var with live consumers.

For unreleased or branch-local interfaces: rewrite directly, no shims needed.
