# Review Gate

Run this self-review on your own diff **before** reporting a task as done for any
change beyond pure copy/docs. Static rules are enforced by
`scripts/check-review-gate-rules.mjs` (via `bun run ai:eval`) — that checker
is the authoritative list; ❌/✅ examples live in `docs/ai/common-mistakes.md`.
This checklist adds the **behavioural items a static analyzer cannot see**; each
`(static: id)` tag points at the rule covering it.

Report the result in the `## Risks / follow-up` section of your final response.
If any **P0** item fails, stop and fix before doing anything else.

## P0 — Security (blocking, immutable)

- [ ] No RLS bypass; access control relies on RLS, not UI hiding.
- [ ] New tables/policies follow `docs/conventions/supabase-security.md`
      (RLS enabled, owner uses `auth.uid()`).
- [ ] No secrets committed (`bun run scripts/check-secrets.mjs`).

## Behaviour a static check can't see

- [ ] Zustand holds client UI state only — no server data mirrored.
- [ ] Tests cover the happy path **and** at least one failure path.
- [ ] Errors in server I/O are propagated/returned/logged — not swallowed.
- [ ] Imports respect package boundaries in `docs/architecture/overview.md`.
- [ ] Diff is scoped to the task; no unrelated working-tree changes bundled.

## Verification (goal-driven, narrowest gate first)

- [ ] Ran the narrowest gate that proves the change (see
      `docs/ai/agent-command-policy.md`), not full suite by reflex.
- [ ] Context edits → `bun run ai:check` + `bun run ai:eval`.
      Code → `typecheck` / `lint` / `test` (+ `build` if bundle can change).
- [ ] For diffs under `apps/web/src/features/watch`, optionally dispatch the
      `watch-sync-reviewer` subagent for an isolated domain pass.

## Feedback loop (turn a miss into a guardrail)

- [ ] Add the ❌/✅ pair to `docs/ai/common-mistakes.md` (trim a stale entry to
      stay within budget).
- [ ] If regex-catchable, add a rule + self-test to
      `scripts/review-gate-rules.mjs` so the next miss fails the gate.

Real misses become permanent guardrails. No LLM-judge eval tier (ADR-0009).

## Static Rule Inventory

Static rules (id, severity, summary, fix) are defined in
`scripts/review-gate-rules.mjs` — the single source of
truth. `bun run ai:eval` enforces them; `docs/ai/common-mistakes.md` gives the
❌/✅ explanations. Do not re-transcribe the rule table here.
