# Context-Layer Remediation — 2026-07

- **Status:** Draft — awaiting user approval (refactor-plan approval gate).
- **Date:** 2026-07-17
- **Source:** Independent context-layer review (session 2026-07-17). Findings
  ranked A1–A3 (severe), B4–B8 (medium), C (minor).
- **Branch:** `chore/context-layer-remediation` (new, off `main`; see Pre-flight
  for working-tree isolation).
- **Skill:** `refactor-plan`. Commit-per-step is **not** enabled unless the user
  opts in at approval time.

## Goal

Close the three broken feedback loops found in the review — (1) billing has no
ownership surface, (2) the behavioral-eval instrument records a dead baseline,
(3) the drift notice fires as noise — plus five hygiene defects, without adding
context weight beyond one lean convention doc.

## Non-goals (hard fence)

- **No runtime behavior changes.** Nothing under `apps/web/src`,
  `packages/*/src` (except deleting the empty `packages/features`), or
  `supabase/migrations` is edited. Billing *code* is untouched.
- **No new skills** (a billing skill is fog — see Not yet specified).
- **No size-budget raises** in `scripts/ai-context.manifest.json`.
- **Do not touch** the uncommitted glass/tokens/env work sitting on
  `fix/billing-quota-atomicity` — it belongs to another task.
- **No deletion of behavioral-eval scripts** — the retire path disables the
  baseline record, not the instrument.
- **No commits or pushes** unless the user asks.

## Context (evidence)

- `scripts/context-map.json` has no `billing` subsystem, while
  `apps/web/src/features/billing/` has 13 files (webhooks, Polar, Inngest jobs)
  and the last 3 commits are billing bug fixes. `docs/ai/common-mistakes.md`
  §15–16 record two billing bugs whose root cause (no guidance surface) is
  unfixed.
- `scripts/behavioral-evals/last-run.json` (2026-07-10): 8/9 tasks fail in
  **both** A and B modes, `trialsPerMode: 1` (script default is 3), and task
  `01-rls-bypass` shows A-fail/B-pass. This is recorded as
  `behavioralBaseline` in `scripts/ai-metrics.json` (tracked in git).
- `scripts/check-context-drift.mjs` + map: `nextjs-app` covers
  `apps/web/src/**` with owner `apps/web/AGENTS.md` → fires on nearly every
  commit; same for `feature-module` (`apps/web/src/features/**`) and `testing`
  (all test dirs). Session-start notices are ~all false positives.
- `scripts/ai-metrics.json` is git-tracked but rewritten by every `ai:check`
  run (CI, Stop hook) → perpetually dirty working tree.
- `docs/ai/MEMORY.md` lines 23–24 are session-log changelog entries
  (2,089/2,300 bytes — near budget), violating its own pointers-first charter.
- `packages/features` is a placeholder barrel with no runtime API and zero
  importers (verified: only `docs/architecture/project-graph.md` (generated),
  `.fallow/health.json` (cache), and its own files mention `@pumni/features`).
  It contradicts the Working Contract's no-speculative-abstraction rule.
- Minor: `docs/ai/common-mistakes.md` §1 has a 4-space mis-indent on the ✅
  line; `.agents/skills/README.md` shows a stale `server-action` description
  example and claims Cursor/Gemini/OpenHands support that is not configured.

## Target State

1. `context-map.json` owns billing; nav table has a Billing row; a lean
   `docs/conventions/billing.md` (< 3,500 bytes) is the owner doc, registered
   in the manifest (requiredFiles, frontmatterRequired, sizeBudgets).
2. Drift subsystems carry `code` globs **only where code↔doc coupling is
   real** (billing, supabase-security, design-system, watch-sync, validators,
   data-fetching, project-graph, server-client-boundary). `nextjs-app`,
   `feature-module`, and `testing` become nav-only (or narrowly scoped).
3. Behavioral evals: either a re-run baseline with 3 trials and a working
   grader, or an explicit retired state (no `behavioralBaseline` emitted,
   MEMORY notes the instrument is non-functional). No dead baseline persists.
4. `scripts/ai-metrics.json` untracked + gitignored; CI artifact remains the
   trend record.
5. `docs/ai/MEMORY.md` back to pointers-only, comfortably under budget.
6. `packages/features` deleted; project graph regenerated; typecheck/build
   green.

## Constraints & Invariants

- P0–P4 win over this plan. Generated files only change via their sync
  scripts (`ai:nav:sync`, `ai:graph:sync`, `ai:skills:sync`).
- `docs/plans/*` is excluded from link/code-ref checks; all *other* touched
  docs must pass `bun run ai:check` (backtick code refs in
  `docs/conventions/billing.md` are auto-verified by `checkCodeReferences`).
- The Stop hook re-runs `ai:check` when context files change — every phase
  must leave it green, not just the final DoD.
- Deleting `packages/features` is an **ask-first** action under `AGENTS.md`
  Boundaries; user approval of this plan is that permission (confirm at the
  approval gate).

## Pre-flight (must be green before Step 1a)

- [ ] The working tree on `fix/billing-quota-atomicity` is dirty with
      unrelated glass/env work. **Do not stash or commit it.** Execute this
      plan in an isolated worktree off `main` (e.g. `EnterWorktree` /
      `git worktree add`), branch `chore/context-layer-remediation`.
- [ ] Baseline recorded: `bun run ai:check` and `bun run ai:eval` green on the
      new branch. If not green, stop — fix baseline first.
- [ ] `bun scripts/check-ai-context.mjs --self-test` passes (characterization
      baseline for the gate we will re-exercise).
- [ ] Record `bun scripts/check-context-drift.mjs --since=HEAD~3` output as
      the drift-noise baseline (expected: multiple false-positive rows).

---

## Phase 1 — Hygiene (steps independent of each other)

### Step 1a: Untrack and gitignore `scripts/ai-metrics.json`

- **File(s):** `.gitignore`, `scripts/ai-metrics.json` (index only)
- **Action:** Append `scripts/ai-metrics.json` under the existing
  `# AI metrics and run configs` section in `.gitignore`; run
  `git rm --cached scripts/ai-metrics.json`. Do not edit `ai-metrics.mjs` —
  it may keep writing the local file.
- **Verification:** `bun run ai:check && git status --porcelain` → no
  `ai-metrics.json` entry after the check rewrites it.
- **Rollback:** `git checkout -- .gitignore && git restore --staged scripts/ai-metrics.json`
- **Depends on:** none

### Step 1b: Compact `docs/ai/MEMORY.md` to pointers

- **File(s):** `docs/ai/MEMORY.md:23-24`
- **Action:** Replace the two SaaS-billing changelog entries with one pointer
  line: billing platform Phases 0–3 landed → see
  `docs/plans/saas-billing-platform-2026-07-implementation.md`, ADR-0028,
  ADR-0029 (keep dates). No other lines change.
- **Verification:** `bun run ai:check` (size budget 2,300 bytes enforced);
  file < 1,900 bytes.
- **Rollback:** `git checkout -- docs/ai/MEMORY.md`
- **Depends on:** none

### Step 1c: Fix `common-mistakes.md` §1 indentation

- **File(s):** `docs/ai/common-mistakes.md:14`
- **Action:** Remove the stray 4-space indent before the ✅ line so §1 matches
  the ❌/✅ formatting of every other section. No wording changes.
- **Verification:** `bun run ai:check`
- **Rollback:** `git checkout -- docs/ai/common-mistakes.md`
- **Depends on:** none

### Step 1d: True up `.agents/skills/README.md` claims

- **File(s):** `.agents/skills/README.md` (description example block; the
  "Why" paragraph naming Cursor/Gemini/OpenHands)
- **Action:** (1) Replace the stale `server-action` description example with
  the current frontmatter description from
  `.agents/skills/server-action/SKILL.md`. (2) Reword the multi-tool claim to
  "any AGENTS.md-reading agent" without naming tools not configured in this
  repo. No structural changes.
- **Verification:** `bun run ai:check`
- **Rollback:** `git checkout -- .agents/skills/README.md`
- **Depends on:** none

## Phase 2 — Billing ownership surface

### Step 2.1: Author `docs/conventions/billing.md` (lean)

- **File(s):** `docs/conventions/billing.md` (new, target < 3,000 bytes)
- **Action:** Write the owner doc with YAML frontmatter (`description:`) and
  only what code cannot say:
  - Tenancy: personal (per-user) billing via Polar — pointer to ADR-0028.
  - Webhook trust boundary: signature verification before any handler;
    idempotency keyed on provider event id; durable processing via Inngest
    with sync fallback — pointer to ADR-0029 and golden example
    `apps/web/src/features/billing/webhook-handlers.ts`.
  - Quota invariant: plan-quota checks are atomic in Postgres
    (`pg_advisory_xact_lock` + `volatile`, `supabase/migrations/024_atomic_quota_checks.sql`);
    never re-implement quota precheck in app code — pointer to
    `docs/ai/common-mistakes.md` §15–16.
  - Upsert identity rule: `billing_customers` conflicts on `user_id`.
  - Env keys by name only (`POLAR_*`, `INNGEST_*`, `UPSTASH_*`) — server-only.
  - RLS remains the data boundary for `billing_*` tables
    (`docs/conventions/supabase-security.md` owns the how).
- **Verification:** `bun run ai:check` (frontmatter + backtick code refs
  auto-verified once Step 2.3 registers the file; run again after 2.3).
- **Rollback:** delete the new file.
- **Depends on:** none

### Step 2.2: Add `billing` subsystem to `scripts/context-map.json` + nav sync

- **File(s):** `scripts/context-map.json`, `AGENTS.md` (generated block only)
- **Action:** Add subsystem:
  - `name: "billing"`
  - `code: ["apps/web/src/features/billing/**", "apps/web/src/app/api/webhooks/**", "apps/web/src/app/api/inngest/**"]`
    (billing migrations stay owned by `supabase-security` — no double
    ownership).
  - `owners: ["docs/conventions/billing.md"]`
  - `nav: { editing: "Billing, quota, Polar webhooks (features/billing)", read_first: "docs/conventions/billing.md", skill: "—" }`
  Then run `bun run ai:nav:sync` to regenerate the AGENTS.md table.
- **Verification:** `bun run ai:check` (includes nav `--check`);
  `bun scripts/check-context-drift.mjs --since=HEAD~3` now lists `billing`
  for the recent billing commits (positive signal proof).
- **Rollback:** `git checkout -- scripts/context-map.json AGENTS.md`
- **Depends on:** Step 2.1

### Step 2.3: Register the doc in the manifest

- **File(s):** `scripts/ai-context.manifest.json`
- **Action:** Append `docs/conventions/billing.md` to `requiredFiles` and
  `frontmatterRequired`; add `{ "path": "docs/conventions/billing.md", "maxBytes": 3500 }`
  to `sizeBudgets`.
- **Verification:** `bun run ai:check` fully green (this also re-validates
  Step 2.1's code refs and size).
- **Rollback:** `git checkout -- scripts/ai-context.manifest.json`
- **Depends on:** Step 2.1

### Step 2.4: Add quota golden example

- **File(s):** `docs/ai/golden-examples.md` (Supabase section)
- **Action:** Add one bullet:
  `supabase/migrations/024_atomic_quota_checks.sql` — atomic quota RPC
  pattern (advisory lock + volatile recount). One line, no prose padding.
- **Verification:** `bun run ai:check` (path existence auto-checked).
- **Rollback:** `git checkout -- docs/ai/golden-examples.md`
- **Depends on:** none

## Phase 3 — Drift-notice calibration

### Step 3.1: Re-scope noisy subsystems in `scripts/context-map.json`

- **File(s):** `scripts/context-map.json`
- **Action:** Behavior-preserving for nav (rows unchanged), signal-changing
  for drift:
  - `nextjs-app`: **remove** the `code` array (nav-only row, like
    `client-form`). Rationale: `apps/web/AGENTS.md` does not co-evolve with
    every app commit.
  - `feature-module`: remove the `code` array (same rationale;
    feature-module.md is stable convention).
  - `testing`: narrow `code` to `["apps/web/vitest.config.ts", "packages/ui/vitest.config.ts"]`
    — testing.md couples to harness config, not to each test file.
  - Keep `code` globs on: `billing`, `supabase-security`, `design-system`,
    `watch-sync`, `validators`, `data-fetching`, `project-graph`,
    `server-client-boundary` (real code↔doc coupling).
- **Verification:** `bun run ai:nav:sync --check` (nav table unchanged);
  `bun scripts/check-context-drift.mjs --since=HEAD~3` → baseline
  false-positive rows (`nextjs-app`, `testing`) gone; `billing` and any
  genuine `supabase-security` rows remain. Record before/after output in the
  step report.
- **Rollback:** `git checkout -- scripts/context-map.json`
- **Depends on:** Step 2.2 (same file — apply after billing row lands)

## Phase 4 — Behavioral evals: repair or retire (timeboxed)

### Step 4.1: Diagnose the grader/harness (timebox: 60 min)

- **File(s):** none (read/run only)
- **Action:** In order: `bun scripts/run-behavioral-evals.mjs --self-test`;
  `--dry-run`; then one live task pair with
  `BEHAVIORAL_TRIALS=1` on task `02-zustand-mirror-server-state` (cheapest
  deterministic expectation). Inspect the task's `expects_pattern` regexes
  against actual transcript output; identify whether failures are (a) grader
  regex too strict, (b) CLI spawn/timeout issues, or (c) genuine.
- **Verification:** A written diagnosis in the step report naming (a)/(b)/(c)
  per failing task class. No repo files change.
- **Rollback:** n/a
- **Depends on:** none (may run parallel to Phases 1–3)

### Step 4.2: Decision gate — repair or retire

- **Action:** If the cause is (a)/(b) and fixable within a second 60-min
  timebox → **repair path** (Step 4.3a). Otherwise → **retire path**
  (Step 4.3b). Record the decision + evidence in this plan's Decision Log.
- **Depends on:** Step 4.1

### Step 4.3a: Repair path — fix grader, re-baseline honestly

- **File(s):** `scripts/behavioral-evals/golden-tasks/*.md` (expectations
  only) and/or `scripts/run-behavioral-evals.mjs` (grader only — A/B
  semantics unchanged)
- **Action:** Fix the identified grader defects; re-run the full band with
  default `BEHAVIORAL_TRIALS=3`. Accept the new baseline only if it carries
  signal (A/B pass rates differ on ≥ 3 tasks and no A-fail/B-pass on a
  security task without explanation).
- **Verification:** `bun run ai:eval:behavioral` exits 0;
  `scripts/behavioral-evals/last-run.json` shows `trialsPerMode: 3`; update
  the MEMORY baseline line (date + pointer only).
- **Rollback:** `git checkout -- scripts/behavioral-evals scripts/run-behavioral-evals.mjs`
- **Depends on:** Step 4.2

### Step 4.3b: Retire path — stop emitting the dead baseline

- **File(s):** `scripts/ai-metrics.mjs` (~lines 84–101), `docs/ai/MEMORY.md`
- **Action:** Emit `behavioralBaseline: { status: 'invalid', reason:
  'grader non-functional 2026-07-10 run; see docs/plans/context-layer-remediation-2026-07.md' }`
  instead of stale numbers when `last-run.json` predates the retire date or
  carries `trialsPerMode < 3`. Replace the MEMORY ADR-0026 line's implicit
  "landed and working" with "instrument retired pending grader fix". Scripts
  stay in place (fail-open, opt-in).
- **Verification:** `bun run ai:metrics` → local `ai-metrics.json` (untracked
  since 1a) shows the invalid marker; `bun run ai:check` green.
- **Rollback:** `git checkout -- scripts/ai-metrics.mjs docs/ai/MEMORY.md`
- **Depends on:** Step 4.2 (mutually exclusive with 4.3a)

## Phase 5 — Delete `packages/features` (ask-first; approved via this plan)

### Step 5.1: Remove the package

- **File(s):** `packages/features/` (entire directory: `package.json`,
  `AGENTS.md`, `CLAUDE.md`, `src/`, `tsconfig*`)
- **Action:** `git rm -r packages/features`. No root `package.json` edit
  needed (`workspaces: packages/*` is a glob). Run `bun install` to refresh
  `bun.lock`.
- **Verification:** `rg -l "@pumni/features" --glob '!docs/plans/**' --glob '!.fallow/**' --glob '!docs/architecture/project-graph.md'`
  returns nothing; `bun run typecheck` green.
- **Rollback:** `git checkout -- packages/features bun.lock`
- **Depends on:** user approval at the gate.

### Step 5.2: Regenerate the project graph

- **File(s):** `docs/architecture/project-graph.md` (generated)
- **Action:** `bun run ai:graph:sync`.
- **Verification:** `bun run ai:check` green (graph `--check` passes; no
  orphan CLAUDE.md shim errors).
- **Rollback:** `git checkout -- docs/architecture/project-graph.md`
- **Depends on:** Step 5.1

## Final gate — Definition of Done

- [ ] `bun run ai:premerge` green (full ladder — the only place the full
      suite is required).
- [ ] Synthetic check: `touch`-edit a file under `features/billing/`, run
      `bun scripts/check-context-drift.mjs --since=HEAD` on a scratch commit
      → `billing` row fires; revert the scratch.
- [ ] `git status --porcelain` clean after a fresh `bun run ai:check`
      (metrics no longer dirty the tree).
- [ ] `docs/ai/MEMORY.md` < 2,300-byte budget with headroom (< 1,900).
- [ ] Phase 4 decision (repair vs retire) recorded in the Decision Log below.
- [ ] Diff reported in review-gate format; `review-gate` skill run before
      reporting done.

## Testing strategy

Context-layer changes have deterministic gates instead of unit tests: every
step ends on `bun run ai:check` or a script's own `--check`/`--self-test`
mode, which are the characterization tests for this surface. The only
code-adjacent step (5.1) is covered by `typecheck` + the final `ai:premerge`
build. No new test patterns are invented (per `testing-template`).

## Risks & edge cases

| Risk | Severity | Mitigation |
|---|---|---|
| Untracking `ai-metrics.json` loses in-repo trend history | Low | CI uploads snapshots (90-day retention); git history keeps the last tracked copy |
| Narrowed drift globs hide a real doc drift | Med | Coupling-based keep-list (billing, security, design, watch, validators); revisit via fog item if a miss occurs |
| `billing.md` itself drifts from code | Med | Backtick code refs are gate-checked (`checkCodeReferences`); `billing` subsystem now in the drift map |
| Behavioral eval live runs burn quota | Low | Timeboxed, `BEHAVIORAL_TRIALS=1`, single task during diagnosis |
| Hidden consumer of `@pumni/features` | Low | Grep evidence shows zero importers; `typecheck` + `build` gate the deletion |
| Nav-table regeneration collides with the billing-branch worktree | Low | Plan runs in an isolated worktree off `main`; the dirty branch is out of scope |
| New doc + nav row push `AGENTS.md` over its 12,500-byte budget | Low | Current size 10,401 bytes; one compact row adds < 120 bytes; gate enforces |

## Not yet specified (fog of war)

- **Billing skill** — only if webhook/quota edit patterns recur ≥ 2 more
  times; would follow the Subagent Extension Pattern in
  `.agents/skills/README.md`. Do not pre-build.
- **Drift acknowledge mechanism** (per-subsystem last-reviewed SHA) — only if
  noise persists after Step 3.1's re-scoping.
- **Judge-mode eval expansion** (`--judge`) — blocked on Phase 4 outcome;
  meaningless until the pattern grader carries signal.
- **`common-mistakes` honor-system automation** — 5 rules are honor-system;
  decide per rule whether a regex rule is worth it after billing ownership
  lands (some may become statically checkable).

## Decision Log

<!-- Immutable. Date + decision + rationale. Add; never delete. -->
| Date | Decision | Rationale |
|---|---|---|
| 2026-07-17 | Billing migrations stay owned by `supabase-security`, not the new `billing` subsystem | Avoid double-ownership noise; migration guidance is already canonical there |
| 2026-07-17 | Drift calibration = glob narrowing, not an ack mechanism | Smallest delta that restores signal; ack adds state/complexity without proven need |
| 2026-07-17 | Retire path keeps eval scripts on disk | Fail-open, opt-in instrument; deletion would destroy the repair option cheaply kept |
