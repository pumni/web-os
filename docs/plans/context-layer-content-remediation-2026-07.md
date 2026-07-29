# Context-Layer Content Remediation — 2026-07 (round 2)

> Historical — not current guidance. Executed plan retained for audit history.

- **Status:** Executed 2026-07-18 on `chore/context-content-remediation` (commit `48ec675`).
- **Date:** 2026-07-17
- **Source:** Tier-by-tier *content* review (session 2026-07-17, round 2 —
  full-text read of every tier, claims verified against code). Follows
  `docs/plans/context-layer-remediation-2026-07.md` (round 1, executed on
  `chore/context-layer-remediation`, now merged to `main`).
- **Branch:** `chore/context-content-remediation` (new, off `main`).
- **Skill:** `refactor-plan`. Commit-per-step **off** unless the user opts in.

## Goal

Fix every content-level defect the deep read found — instructions that
contradict enforced rules, a truncated security section, a wrong citation,
doc-vs-gate mismatches, verbatim duplication between P2 docs, and the broken
"Tests" flow — plus clear the three execution debts left by round 1. All
changes are docs/context/scripts; zero runtime behavior changes.

## Non-goals (hard fence)

- **No runtime code changes** under `apps/web/src` or `packages/*/src`
  (the only `package.json` touch is the ask-first Step 4b decision).
- **No behavioral-eval grader repair** — still fogged from round 1; do not
  reopen here.
- **No restructuring of skills** beyond the named text fixes (no merging
  `supabase-migration` into `supabase-security` — fog).
- **No size-budget raises**; every edited budgeted file stays under budget.
- **No commits or pushes** unless the user asks.

## Context (evidence — file:line verified this session)

| # | Defect | Where |
|---|---|---|
| C1 | `npx next typegen` contradicts root AGENTS.md **Never** "npm in any form" | `docs/conventions/nextjs-16.md:29`, `.claude/rules/nextjs-async-apis.md:15` (only 2 hits in denylist-scope targets — grep-verified) |
| C2 | "Generated Types" section ends mid-sentence: "…after schema changes and run:" then nothing | `docs/conventions/supabase-security.md:41-43` |
| C3 | Advisory-lock citation names `023_watch_rooms_limit_rls.sql`; the `pg_advisory_xact_lock` + `volatile` pattern is in `024_atomic_quota_checks.sql` (grep-verified) | `docs/conventions/billing.md:12` |
| C4 | Pitfall sentence reads as if auth/supabase/…/config are all "allowed"; and says "`config` is allowed" while `checkUiPackageBoundaries` forbids `@pumni/config` in `packages/ui/src/**` (zero src imports exist — grep-verified; it is a build-time dep only). Also still names deleted `features` package | `packages/ui/AGENTS.md:68-69` |
| C5 | "there are no `.ps1` repo scripts" is false — 4 skills ship and instruct `.ps1` helpers | `AGENTS.md` (Commands section) |
| C6 | Billing nav row is the only row without backticked path | `scripts/context-map.json` (billing `nav.read_first`) |
| C7 | Route Props + Route Segment Config paragraphs duplicated verbatim across two P2 docs; neither phrase registered in `CANONICAL_INVARIANTS` | `docs/conventions/nextjs-16.md:55-57,164-167` ↔ `docs/conventions/server-client-boundary.md:12-14,20-22` |
| C8 | `testing.md` is stale ("starter contract") and never states where tests live (`apps/web/src/test/` mirror) or the deep-import exception | `docs/conventions/testing.md` |
| C9 | Scaffold creates `features/<feature>/__tests__/`; zero features have one — all tests live in `apps/web/src/test/features/` | `.agents/skills/feature-module/scripts/scaffold.ps1:15` + SKILL.md text |
| C10 | Entry pointer to dissolved `docs/ai/index.md` (removed by ADR-0027); stale 5-of-9 conventions list | `docs/README.md:3` |
| C11 | Round-1 debt: `scripts/ai-metrics.json` still tracked (`git ls-files` confirms; `.gitignore` line has no effect on tracked files) | index |
| C12 | Round-1 scope breach: `babel-plugin-react-compiler@1.0.0` added as a literal pin, not `catalog:` | `apps/web/package.json` |
| C13 | Round-1 skipped step: stale `server-action` description example + unconfigured multi-tool claims | `.agents/skills/README.md` |
| C14 | Cosmetic: LaTeX `$\ge$` renders literally; "in Separate `.dark` overrides" wording | `docs/conventions/design-system.md:68,46` |
| C15 | Disk leftovers: `packages/features/node_modules/` orphan dir; `.worktree` for the merged round-1 branch | filesystem |

## Target State

1. Zero `npx` in any always-loaded or path-loaded context file, enforced
   forever by the doc denylist.
2. Every section in `supabase-security.md` is complete and runnable.
3. `billing.md` cites the migration that actually carries the pattern.
4. Every doc claim about an enforced boundary matches the enforcing regex.
5. Route Props / Route Segment Config each have exactly one canonical home
   (`nextjs-16.md`); the duplicate-invariant detector guards both.
6. The "Tests" flow (nav → `testing.md` → `testing-template` → scaffold)
   agrees with where tests actually live.
7. Round-1 debts cleared: metrics file untracked, compiler-plugin decision
   made via the dependency-update rules, README claims true.

## Constraints & Invariants

- P0–P4 win. Generated surfaces only change via sync scripts
  (`ai:nav:sync` for the nav table; never hand-edit the generated block).
- Budgeted files stay under budget: `nextjs-16.md` ≤ 5500 B,
  `nextjs-async-apis.md` ≤ 900 B, `design-system.md` ≤ 8800 B,
  `billing.md` ≤ 3500 B; compact-table style enforced in all of them.
- `docs/conventions/*` and `docs/ai/*` edits are gate-checked
  (`checkCodeReferences` validates backtick code paths; frontmatter
  `description:` required). `docs/plans/*` (this file) is exempt.
- The Stop hook re-runs `ai:check` on context edits — every phase must end
  green, not just the final DoD.
- Step 4b (dependency) is **ask-first** under AGENTS.md Boundaries; execute
  only the option the user approves at the gate.

## Pre-flight (green before Step 1a)

- [ ] On `main`, `git status --porcelain` clean (ignore `node_modules`).
      Create branch `chore/context-content-remediation`.
- [ ] Baseline recorded: `bun run ai:check` and `bun run ai:eval` green.
- [ ] `bun scripts/check-ai-context.mjs --self-test` passes (characterization
      baseline for the gate scripts touched in Steps 1c/3a).

---

## Phase 1 — Correctness fixes (P0-adjacent content)

### Step 1a: Replace `npx` with `bunx` in the canonical Next.js doc

- **File(s):** `docs/conventions/nextjs-16.md:26-30`
- **Action:** Change the fenced command to `bunx next typegen`; scan the file
  for any other `npx` (grep says none).
- **Verification:** `grep -rn "npx" docs/conventions/` → 0 hits;
  `bun run ai:check` green (size budget 5500 B holds).
- **Rollback:** `git checkout -- docs/conventions/nextjs-16.md`
- **Depends on:** none

### Step 1b: Same fix in the path-scoped rule

- **File(s):** `.claude/rules/nextjs-async-apis.md:15`
- **Action:** `npx next typegen` → `bunx next typegen`. No other changes —
  file has a 900-byte budget.
- **Verification:** `grep -rn "npx" .claude/rules/` → 0 hits; `bun run ai:check`.
- **Rollback:** `git checkout -- .claude/rules/nextjs-async-apis.md`
- **Depends on:** none (parallel with 1a)

### Step 1c: Teach the doc denylist to ban `npx` permanently

- **File(s):** `scripts/check-ai-context.mjs` (`checkDocApiDenylist` DENY array)
- **Action:** Add entry
  `{ token: 'npx', reason: 'banned package runner (root AGENTS.md Never: npm in any form) — use bunx' }`.
  Scope check: DENY targets are AGENTS.md, apps/web/AGENTS.md,
  `docs/conventions/`, `docs/ai/`, `.claude/rules/` — grep confirmed zero
  remaining hits after 1a/1b ("bunx" does not contain the substring "npx",
  so no false positive).
- **Verification:** `bun run ai:check` green; then a negative test: add
  `npx` to a scratch line in `docs/ai/mcp.md`, confirm `ai:check` **fails**,
  revert the scratch, confirm green again.
- **Rollback:** `git checkout -- scripts/check-ai-context.mjs`
- **Depends on:** 1a AND 1b (must land first or the new rule fails the gate)

### Step 1d: Complete the truncated "Generated Types" section

- **File(s):** `docs/conventions/supabase-security.md:41-44`
- **Action:** Finish the sentence with the repo's actual workflow (source:
  `docs/plans/saas-billing-platform-2026-07-refinement.md:80`):
  a fenced block with
  `bunx supabase gen types typescript --local > packages/supabase/src/types.ts`
  followed by `bun run typecheck`, and the "never hand-edit the output" rule
  (pointer to `packages/supabase/AGENTS.md` which already owns it).
- **Verification:** `bun run ai:check` green; visually no heading in the file
  is followed by an empty body.
- **Rollback:** `git checkout -- docs/conventions/supabase-security.md`
- **Depends on:** none

### Step 1e: Fix the billing.md migration citation

- **File(s):** `docs/conventions/billing.md:12`
- **Action:** Replace `supabase/migrations/023_watch_rooms_limit_rls.sql`
  with `supabase/migrations/024_atomic_quota_checks.sql` as the advisory-lock
  example (023 is the RLS-limit migration, not the lock pattern).
- **Verification:** `grep -n "advisory" supabase/migrations/024_atomic_quota_checks.sql`
  shows the pattern; `bun run ai:check` green (code-ref validated).
- **Rollback:** `git checkout -- docs/conventions/billing.md`
- **Depends on:** none

## Phase 2 — Doc-vs-enforcement contradictions

### Step 2a: Rewrite the `@pumni/ui` pitfall sentence to match the gate

- **File(s):** `packages/ui/AGENTS.md:66-70` (Pitfalls, first bullet)
- **Action:** Replace the ambiguous sentence with two unambiguous ones:
  (1) never import `@/`, `server-only`, or **any** `@pumni/*` package from
  `packages/ui/src/**` — `checkUiPackageBoundaries` blocks them all,
  including `@pumni/config`; (2) `@pumni/config` is a build-time dependency
  (ESLint flat config) consumed **outside** `src/`, which is why it appears
  in `package.json` but may never appear in a src import. Drop the deleted
  `features` name. Leave the `checkUiPackageBoundaries` regex itself
  unchanged (keeping `features` there guards against reintroduction).
- **Verification:** `grep -rn "@pumni/config" packages/ui/src/` → 0 hits
  (confirms the statement is true); `bun run ai:check` green.
- **Rollback:** `git checkout -- packages/ui/AGENTS.md`
- **Depends on:** none

### Step 2b: Fix the false "`no .ps1` repo scripts" claim in root AGENTS.md

- **File(s):** `AGENTS.md` (Commands & Validation Gates, first paragraph —
  human-authored prose, NOT the generated nav block)
- **Action:** Reword to: root automation under `scripts/` is `.mjs` behind
  `bun run`; skill helpers under `.agents/skills/*/scripts/` may be `.ps1`
  (PowerShell 7 is the canonical shell) with `.sh` twins only for
  cross-platform fallback. Keep the `$env:`/pwsh caveat unchanged.
- **Verification:** `bun run ai:check` green (12,500 B budget holds; current
  ~10.4 KB + one sentence).
- **Rollback:** `git checkout -- AGENTS.md`
- **Depends on:** none

### Step 2c: Backtick the billing nav row

- **File(s):** `scripts/context-map.json` (billing subsystem `nav`),
  `AGENTS.md` (generated block via sync only)
- **Action:** Change `read_first` to `` `docs/conventions/billing.md` `` to
  match every other row; run `bun run ai:nav:sync`.
- **Verification:** `bun run ai:check` green (includes nav `--check`); the
  regenerated row renders with backticks.
- **Rollback:** `git checkout -- scripts/context-map.json AGENTS.md`
- **Depends on:** 2b (both edit `AGENTS.md`; serialize to keep diffs clean)

## Phase 3 — Deduplication + the "Tests" flow

### Step 3a: Collapse the duplicated sections to pointers

- **File(s):** `docs/conventions/server-client-boundary.md:12-14,18-22`
- **Action:** Canonical home is `nextjs-16.md`. Replace the verbatim
  "Route Segment Config" bullet and the "Next.js Route Props" section with
  one-line pointers ("Route props & segment config: see
  `docs/conventions/nextjs-16.md`"). The file keeps its unique content
  (server-only isolation, service-role, state placement pointer).
- **Verification:** `bun run ai:check` green; the two paragraphs now exist
  in exactly one file (`grep -c "PageProps" docs/conventions/*.md`).
- **Rollback:** `git checkout -- docs/conventions/server-client-boundary.md`
- **Depends on:** none

### Step 3b: Register both invariants in the duplicate detector

- **File(s):** `scripts/check-ai-context.mjs` (`CANONICAL_INVARIANTS`)
- **Action:** Add two entries with canonical `docs/conventions/nextjs-16.md`:
  a phrase regex for the route-props helpers
  (`/\bPageProps<.*LayoutProps</i` — tune to match both docs' phrasing) and
  one for segment config
  (`/route segment config exports\b.*\buse cache\b/i`). Follow the existing
  entry style; the pointer added in 3a satisfies the detector for
  `server-client-boundary.md`.
- **Verification:** `bun run ai:check` green; negative test: temporarily
  restore one duplicated paragraph without a pointer → `ai:check` **fails**;
  revert; green again.
- **Rollback:** `git checkout -- scripts/check-ai-context.mjs`
- **Depends on:** 3a

### Step 3c: Rewrite `testing.md` to close the Tests-flow gap

- **File(s):** `docs/conventions/testing.md`
- **Action:** Keep it lean (< ~2.5 KB) but make it answer what the flow
  currently cannot: (1) **where tests live** — unit/component tests in
  `apps/web/src/test/` mirroring feature structure (e.g.
  `src/test/features/watch-sync-machine.test.ts`), package tests in
  `packages/<pkg>/src/test/`; (2) test files under `apps/web/src/test/` are
  the **only** code allowed to deep-import feature internals (pointer to
  `docs/conventions/feature-module.md` Firewall exception); (3) drop the
  stale "starter contract" phrase; (4) keep the unit/e2e/typecheck command
  sections as-is.
- **Verification:** `bun run ai:check` green (frontmatter kept; cited paths
  auto-validated); `wc -c` < 2600.
- **Rollback:** `git checkout -- docs/conventions/testing.md`
- **Depends on:** none

### Step 3d: Align the feature scaffold with real test location

- **File(s):** `.agents/skills/feature-module/scripts/scaffold.ps1:15`,
  `.agents/skills/feature-module/SKILL.md` (the scaffold description line)
- **Action:** Remove `__tests__/` from the created dirs; instead have the
  script print a final reminder: "Add tests under
  `apps/web/src/test/features/<name>.test.ts` (see docs/conventions/testing.md)".
  Update the SKILL.md line "(queries.ts, actions.ts, index.ts, __tests__/)"
  to match. Regenerate shims if the description changed
  (`bun run ai:skills:sync` — description is not changing, body only, so
  expect a no-op; run `--check` to confirm).
- **Verification:** `pwsh -File .agents/skills/feature-module/scripts/scaffold.ps1 -FeatureName ztest`
  in a scratch dir → creates no `__tests__`; delete scratch output;
  `bun run ai:check` green.
- **Rollback:** `git checkout -- .agents/skills/feature-module/`
- **Depends on:** 3c (testing.md must state the location the reminder cites)

### Step 3e: Fix `docs/README.md` entry pointers

- **File(s):** `docs/README.md`
- **Action:** Replace the dead "`ai/index.md`" pointer with: agents start at
  the root `AGENTS.md` navigation table (per ADR-0027). Replace the stale
  5-item conventions list with a single line pointing at
  `docs/conventions/` + the nav table (do not maintain a second index —
  that is the F4 failure class ADR-0027 removed).
- **Verification:** `bun run ai:check` green; no relative pointer in the
  file references a non-existent path.
- **Rollback:** `git checkout -- docs/README.md`
- **Depends on:** none

## Phase 4 — Round-1 execution debt

### Step 4a: Actually untrack `scripts/ai-metrics.json`

- **File(s):** git index only (`.gitignore` line already exists)
- **Action:** `git rm --cached scripts/ai-metrics.json`.
- **Verification:** `git ls-files scripts/ai-metrics.json` → empty;
  `bun run ai:check && git status --porcelain` → no `ai-metrics.json` row.
- **Rollback:** `git restore --staged scripts/ai-metrics.json`
- **Depends on:** none

### Step 4b: Resolve the `babel-plugin-react-compiler` pin (ASK-FIRST)

- **File(s):** `apps/web/package.json`, possibly root `package.json`
  (catalog), `bun.lock`
- **Action:** Decision gate with evidence: temporarily remove the dep, run
  `bun install && bun run build`.
  - Build **fails** (React Compiler needs the Babel plugin): keep the dep but
    move the version to the root catalog and reference `catalog:` per the
    `dependency-update` skill; isolated commit.
  - Build **passes**: delete the dep (it was an unnecessary round-1
    addition); `bun install` to refresh the lockfile.
  Present the evidence to the user before applying either option (core
  dependency change = ask-first under AGENTS.md).
- **Verification:** `bun run build` green on the chosen option; `git diff`
  shows workspace file using `catalog:` (option 1) or clean removal
  (option 2).
- **Rollback:** `git checkout -- apps/web/package.json package.json bun.lock && bun install`
- **Depends on:** user approval at the gate

### Step 4c: Execute the skipped skills-README step from round 1

- **File(s):** `.agents/skills/README.md`
- **Action:** (1) Replace the stale `server-action` description example block
  with the current frontmatter description from
  `.agents/skills/server-action/SKILL.md:3`. (2) Reword the shim-rationale
  paragraph's "(Cursor, Gemini CLI, OpenHands…)" to "any AGENTS.md-reading
  agent" — do not name tools this repo has not configured.
- **Verification:** `bun run ai:check` green; the example text matches the
  live description verbatim.
- **Rollback:** `git checkout -- .agents/skills/README.md`
- **Depends on:** none

### Step 4d: Filesystem cleanup from round 1

- **File(s):** `packages/features/node_modules/` (orphan, untracked),
  `.worktree/` (merged round-1 worktree)
- **Action:** Delete the orphan `packages/features/` dir (only
  `node_modules` remains in it); `git worktree remove .worktree` (branch is
  merged — verify with `git branch --merged main | grep context-layer-remediation`
  first).
- **Verification:** `Test-Path packages/features` → false;
  `git worktree list` shows no `.worktree`; `git status` unchanged.
- **Rollback:** n/a (untracked artifacts; worktree can be re-added with
  `git worktree add`)
- **Depends on:** none

## Phase 5 — Cosmetic batch (one step, one commit if committing)

### Step 5a: design-system.md typography fixes

- **File(s):** `docs/conventions/design-system.md:46,68`
- **Action:** Line 68: `$\ge$` → `≥` (LaTeX does not render in this
  pipeline). Line 46: fix "duplicating declarations in Separate `.dark`
  overrides" → "…in separate `.dark` overrides". No rule-content changes.
- **Verification:** `bun run ai:check` green (8,800 B budget; compact tables
  unaffected).
- **Rollback:** `git checkout -- docs/conventions/design-system.md`
- **Depends on:** none

## Final gate — Definition of Done

- [ ] `bun run ai:premerge` green.
- [ ] `grep -rn "npx" AGENTS.md apps/web/AGENTS.md docs/conventions/ docs/ai/ .claude/rules/` → 0 hits, and the denylist negative test demonstrated a failure then green.
- [ ] Duplicate-invariant negative test demonstrated (3b) — detector fails on a restored duplicate, green after revert.
- [ ] `git ls-files scripts/ai-metrics.json` empty; tree stays clean after `ai:check`.
- [ ] 4b decision (keep-via-catalog vs remove) recorded in the Decision Log with build evidence.
- [ ] `review-gate` skill run before reporting done; diff reported in review-gate format.

## Testing strategy

Deterministic gates are the characterization tests for this surface:
`ai:check` after every step, `--self-test` before and after touching
`check-ai-context.mjs`, plus explicit **negative tests** for the two new
detector entries (1c, 3b) — a guard that never fired is not proven. The only
build-touching step (4b) carries its own `bun run build` evidence. No new
test patterns invented (per `testing-template`).

## Risks & edge cases

| Risk | Severity | Mitigation |
|---|---|---|
| `npx` denylist false-positives in future docs quoting external tooling | Low | Scope is the 5 always/path-loaded target sets only; ADRs/plans/research exempt by design |
| Invariant regexes (3b) over- or under-match | Med | Negative test required in-step; tune phrase until the restored duplicate fails and the pointer form passes |
| 4b removal breaks the build (React Compiler active monorepo-wide) | Med | Evidence-first: build both options before asking; never land the failing one |
| testing.md rewrite drifts from vitest configs (P1) | Low | Cite only verified paths (`apps/web/src/test/` exists — checked); include-patterns stay owned by `vitest.config.ts` |
| Two AGENTS.md-editing steps collide (2b, 2c) | Low | Serialized via Depends-on; 2c edits only through `ai:nav:sync` |
| Worktree removal loses unmerged work | Low | Gate: `git branch --merged main` check before removal |

## Not yet specified (fog of war)

- **Behavioral-eval grader repair** — carried from round 1; blocked on a
  timeboxed diagnosis session; do not touch here.
- **`supabase-migration` skill ↔ `supabase-security.md` overlap** — sediment
  watch; collapse to pointers only if a drift incident occurs between them.
- **A "no empty section body" doc lint** (would have caught C2) — only if a
  second truncation incident appears; one data point does not justify a rule.
- **`context-health` checklist sharpening** — fold into the next quarterly
  checkpoint (2026-10) rather than a standalone change.

## Decision Log

<!-- Immutable. Date + decision + rationale. Add; never delete. -->
| Date | Decision | Rationale |
|---|---|---|
| 2026-07-17 | Keep `features` in the `checkUiPackageBoundaries` regex after the doc fix | Guards against package reintroduction; zero cost |
| 2026-07-17 | `docs/README.md` becomes a pointer, not a second index | Maintaining two maps is the F4 failure class ADR-0027 eliminated |
| 2026-07-17 | Canonical home for Route Props/Segment Config = `nextjs-16.md` | It owns all other Next.js 16 mechanics; server-client-boundary keeps isolation rules only |
| 2026-07-17 | Remove `babel-plugin-react-compiler` from `apps/web` | Build succeeded without the plugin, proving the dependency was an unnecessary addition in round 1 |
