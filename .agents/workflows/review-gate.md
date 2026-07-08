# Review Gate

Self-review a diff **before** reporting a task done for any change beyond pure
copy/docs. Static rules + ❌/✅: `scripts/review-gate-rules.mjs` (via
`bun run ai:eval`) and `docs/ai/common-mistakes.md`. This adds the
**behavioural items a static analyzer cannot see**. Report in
`## Risks / follow-up`; any **P0** miss stops the task.
## P0 — Security (blocking, immutable)

- [ ] No RLS bypass; access control relies on RLS, not UI hiding.
- [ ] New tables/policies follow `docs/conventions/supabase-security.md`
      (RLS enabled, owner uses `auth.uid()`).
- [ ] No secrets committed (`bun run scripts/check-secrets.mjs`).

## Pre-flight (for refactors only)

No baseline = no proof behavior was preserved. Run these **before** the first
edit on any structural reshuffle (the `refactor-plan` skill owns the procedure):

- [ ] Narrowest gate green and recorded as baseline.
- [ ] Dedicated branch created before any code change.
- [ ] Non-goals and "do-not-touch" paths declared up front.
- [ ] Characterization test at the public seam where coverage is missing.

## Behaviour a static check can't see

- [ ] Zustand holds client UI state only (`docs/conventions/data-fetching.md`).
- [ ] Tests cover the happy path **and** at least one failure path.
- [ ] Errors in server I/O are propagated/returned/logged — not swallowed.
- [ ] Imports respect package boundaries in `docs/architecture/overview.md`.
- [ ] Diff is scoped to the task; no unrelated working-tree changes bundled.

## Verification (goal-driven, narrowest gate first)

- [ ] Narrowest gate proving the change ran green (see
      `docs/ai/agent-command-policy.md`); not full suite by reflex.
- [ ] Context edits → `bun run ai:check` + `bun run ai:eval`. Code →
      `typecheck`/`lint`/`test` (+ `build` if bundle can change).
- [ ] `apps/web/src/features/watch` diffs → optionally dispatch
      `watch-sync-reviewer`.
- [ ] `supabase/migrations` diffs → optionally dispatch `supabase-rls-reviewer`.

## Feedback loop (turn a miss into a guardrail)

- [ ] Add the ❌/✅ pair to `docs/ai/common-mistakes.md` (trim a stale entry to
      stay in budget).
- [ ] If regex-catchable, add a rule + self-test to
      `scripts/review-gate-rules.mjs` so the next miss fails the gate.

Real misses become permanent guardrails (ADR-0009).

## Static Rule Inventory

Static rules (id, severity, summary, fix) live in
`scripts/review-gate-rules.mjs` — the single source of truth, enforced by
`bun run ai:eval`. ❌/✅ explanations live in `docs/ai/common-mistakes.md`; do
not re-transcribe the rule table here.
