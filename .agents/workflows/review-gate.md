# Review Gate

Run this self-review on your own diff **before** reporting a task as done for any
change beyond pure copy/docs. The static rules are enforced by
`scripts/check-review-gate-rules.mjs` (run via `bun run ai:eval`) — that checker
is the authoritative rule list; ❌/✅ examples live in `docs/ai/common-mistakes.md`.
This checklist adds the **behavioural items a static analyzer cannot see**; each
`(static: id)` tag points at the rule that already covers it.

Report the result in the `## Risks / follow-up` section of your final response.
If any **P0** item fails, stop and fix before doing anything else.

## P0 — Security (blocking, immutable)

- [ ] No RLS bypass; access control relies on Row Level Security, not UI hiding.
- [ ] New tables/policies follow `docs/conventions/supabase-security.md`
      (RLS enabled, owner predicate uses `auth.uid()`).
- [ ] No secrets committed (`bun run scripts/check-secrets.mjs`).

## Behaviour a static check can't see

- [ ] Zustand holds client UI state only — no server data mirrored into it.
- [ ] Tests cover the happy path **and** at least one failure path.
- [ ] Errors in server I/O are propagated/returned/logged — not swallowed.
- [ ] Imports respect package boundaries in `docs/architecture/overview.md`.
- [ ] Diff is scoped to the task; no unrelated working-tree changes bundled in.

## Verification (goal-driven, narrowest gate first)

- [ ] Ran the narrowest gate that proves the change (see
      `docs/ai/agent-command-policy.md` altitude table), not the full suite by reflex.
- [ ] Context-layer edits → `bun run ai:check` + `bun run ai:eval`.
      Code edits → `typecheck` / `lint` / `test` (+ `build` if the bundle can change).

## Feedback loop (turn a miss into a guardrail)

When this review or a user correction surfaces a **mistake class not already
captured**, close the loop in the same change so it cannot recur:

- [ ] Add the ❌/✅ pair to `docs/ai/common-mistakes.md` (trim a stale entry to
      stay within its budget).
- [ ] If regex-catchable, also add a rule + self-test to
      `scripts/review-gate-rules.mjs` so the next miss fails the gate, not review.

Real misses become permanent guardrails. No LLM-judge eval tier (ADR-0009).

## Static Rule Inventory

The 16 static rules (id, severity, summary, fix) are defined once in the
registry `scripts/review-gate-rules.mjs` — that file is the single source of
truth. `bun run ai:eval` enforces them; `docs/ai/common-mistakes.md` gives the
❌/✅ explanation of each. Read those — do not re-transcribe the rule table here.
