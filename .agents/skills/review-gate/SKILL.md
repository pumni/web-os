---
name: review-gate
description: Self-review a diff before reporting done on any change beyond pure copy/docs. Use before reporting done on any diff beyond pure copy/docs, when a review-gate rule fires, or when closing any feature, refactor, or context-layer step. Runs the static gate (bun run ai:review) plus the behavioural items a static checker cannot see.
---

# Review Gate

Self-review a diff **before** reporting done for any change beyond pure copy/docs.
Static rules: `scripts/review-gate-rules.mjs` (via `bun run ai:review`) and
`docs/ai/common-mistakes.md`. Any security miss stops the task.

## Rules

- Run `bun run ai:review` before reporting done on any non-trivial diff.
- Any security miss (RLS bypass, secret committed, server-only leak) stops immediately.
- Add each new miss to `docs/ai/common-mistakes.md`; if regex-catchable, add a rule to `scripts/review-gate-rules.mjs`.
- Pre-flight for refactors is owned by the `refactor-plan` skill.

## Known Failure Modes

| Symptom | Cause | Fix |
|---|---|---|
| Security miss reaches main | Review skipped | Run `bun run ai:review` first, never last |
| Rule fires but fix unclear | ❌/✅ pair missing | Add pair to `docs/ai/common-mistakes.md` |

## Security Invariants (blocking)

- [ ] No RLS bypass; access control relies on RLS, not UI hiding.
- [ ] New tables/policies follow `docs/conventions/supabase-security.md`.
- [ ] No secrets committed (`bun run scripts/check-secrets.mjs`).

## Behaviour a static check can't see

- [ ] Zustand: client UI state only (`docs/conventions/data-fetching.md`).
- [ ] Tests cover happy path and at least one failure path.
- [ ] Server I/O errors propagated/returned/logged — not swallowed.
- [ ] Imports respect package boundaries (`docs/architecture/overview.md`).
- [ ] Diff scoped to task; no unrelated changes bundled.

## Verification (narrowest gate first)

- [ ] Narrowest gate ran green (see root `AGENTS.md` validation gates).
- [ ] Context edits: `bun run ai:check` + `bun run ai:review`.
- [ ] Code: `typecheck`/`lint`/`test` (+ `build` if bundle-affecting).
- [ ] Watch diffs: optionally dispatch `watch-sync-reviewer`.
- [ ] Migration diffs: optionally dispatch `supabase-rls-reviewer`.

## Static Rule Inventory

Static rules live in `scripts/review-gate-rules.mjs` — enforced by `bun run ai:review`. ❌/✅ live in `docs/ai/common-mistakes.md`; do not re-transcribe.

## Checklist

- [ ] `bun run ai:review` ran and passed (or each failure understood).
- [ ] Security items checked.
- [ ] Behavioural items checked (state, errors, imports, scope).
- [ ] Any new miss recorded in `docs/ai/common-mistakes.md`.
- [ ] Context-only diffs verified with `bun run ai:check` + `bun run ai:review`.
