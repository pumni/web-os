# Context-Layer Overhaul — 2026-07 (round 3)

- **Status:** Draft — awaiting user approval (refactor-plan approval gate).
- **Date:** 2026-07-18
- **Source:** Independent full-tier context-layer review (session 2026-07-18 —
  every runtime-loaded file read in full: root + 9 nested `AGENTS.md`,
  11 convention docs, 2 architecture docs, 5 `docs/ai/*`, ADR register +
  context ADRs, all 21 canonical skills, the whole `.claude/` tier, manifest,
  context-map, and enforcement scripts). Follows rounds 1–2
  (`context-layer-remediation-2026-07.md`, `context-layer-content-remediation-2026-07.md`).
- **Branch:** `chore/context-layer-r3` — branch off `chore/context-content-remediation`
  if round 2 is not yet merged to `main` at execution time; otherwise off `main`.
- **Skill:** `refactor-plan`. Commit-per-step **off** unless the user opts in.
- **Executor contract:** every step names its exact file(s), edit, verification
  command, rollback, and dependencies. Do not improvise beyond a step's Action.
  If a step's verification fails twice with no clear cause, or an edit would
  touch a file outside the declared scope, **stop and ask the user**.

## Goal

Close the five systemic gaps the round-3 review found:

1. **Truth repairs** — two P2 docs and two plan records currently emit false
   information (ghost package, dead evidence loop, wrong statuses).
2. **Enforcement completeness** — 4 of 9 nested `AGENTS.md` are unenforced;
   one P2 doc is unreachable from the navigation table.
3. **Behavioral plane** — the only instrument that proves the context layer
   changes agent behavior is dead; decide repair vs public retirement and make
   the repo's claims match reality.
4. **Risk-weighted enforcement** — the bug classes that actually shipped
   (service-role scope, quota atomicity) are honor-system while trivia is
   automated; add machine checks where deterministically possible.
5. **Instrument hardening** — duplicate-invariant detector misses the Next.js
   cache rules it claims to guard; drift notice window is one commit; harness
   loading is unverifiable (F1-class residual risk); meta-churn has no brake.

## Non-goals (hard fence)

- **No runtime behavior changes.** Nothing under `apps/web/src` or
  `packages/*/src` is edited. No migrations. No dependency changes.
- **No size-budget raises** in `scripts/ai-context.manifest.json`.
- **No read-chain restructuring** (merging `data-fetching.md` /
  `nextjs-16.md`, slimming mandatory hops) — fog; needs a measured trigger.
- **No new skills, no skill merges** (e.g. `supabase-migration` into
  `supabase-security.md` stays fog).
- **No edits to ADR *bodies*** other than the ADR-0026 status line
  (lifecycle-legal transition) and `docs/adr/README.md` (not an ADR).
- **No commits or pushes** unless the user asks. Never skip hooks.

## Context (evidence — verified 2026-07-18)

| # | Finding | Where |
|---|---|---|
| E1 | Prose lists deleted `@pumni/features` as a live leaf package | `docs/architecture/project-graph.md:60` (human-authored section below the generated block) |
| E2 | Context-ADR reopen condition requires citing a metric from `scripts/ai-metrics.json`, whose `behavioralBaseline` is retired/invalid and the file is untracked — the freeze cannot be legally unlocked | `docs/adr/README.md` ("When to write one", last bullet) |
| E3 | Rounds 1–2 plan files still read `Status: Draft — awaiting user approval` though both executed (round 1 merged; round 2 = commit `48ec675`) | both plan headers |
| E4 | Untrusted Content Policy says only `docs/` + `.agents/` are guidance — omits the nested `AGENTS.md` tree and `.claude/` adapters | root `AGENTS.md` |
| E5 | `packages/{config,env,test-utils,validators}/AGENTS.md` absent from `requiredFiles`; deleting one fails no gate, yet the nav row "Any `packages/*` package" depends on them | `scripts/ai-context.manifest.json` |
| E6 | `server-client-boundary` subsystem has `owners` + `code` but **no `nav` entry** — the only P2 convention doc unreachable from the nav table | `scripts/context-map.json` (last subsystem) |
| E7 | Stop-gate regex watches `llms.txt`, `GEMINI.md`, `CODEX.md` — none exist | `.claude/hooks/ai-context-stop-gate.mjs:19-21` |
| E8 | Behavioral eval instrument dead (8/9 fail both modes, grader defect per ADR-0026 context; MEMORY: "instrument retired pending grader fix"); 21 per-skill `evals/evals.json` have **no runner** (`run-ai-evals.mjs` runs only static rules + secrets; gate validates evals.json shape *only if present* — `checkSkillEvalsAndPaths`); `.agents/skills/README.md` still teaches eval-first authoring as if measured | `scripts/`, `.agents/skills/README.md` |
| E9 | `CANONICAL_INVARIANTS` does not register the five Next.js cache invariants (`cacheLife` minimum, parameterized `cacheTag`, `'use cache'` placement, `updateTag` scope, two-arg `revalidateTag`) that live in ≥3 homes (`nextjs-16.md`, skills, `common-mistakes.md` §10) | `scripts/check-ai-context.mjs` (`checkInvariantDuplicates`) |
| E10 | Service-role module allowlist in `supabase-security.md` ("Service-Role Key Exceptions", 4 modules) is prose-only; `service-role-client` rule scans client bundles, not server modules outside the list | `docs/conventions/supabase-security.md:52-57`, `scripts/review-gate-rules.mjs` |
| E11 | Quota-precheck race (`common-mistakes.md` §16) is honor-system though it caused a real bug; `scripts/ai-review-rule-allowlist.json` exists for historical-file exemptions | `docs/ai/common-mistakes.md`, `scripts/` |
| E12 | Drift notice fires with `--since=HEAD~1` at SessionStart only — drift ≥2 commits old is invisible forever | `.claude/hooks/context-drift-notice.mjs:18` |
| E13 | No canary verifies that CLAUDE.md `@AGENTS.md` import, nested closest-wins, or `.claude/rules` `paths:` loading actually load in the harness — the exact F1 failure class (silent non-loading) remains unobservable | `context-health` skill |
| E14 | ~30 archived context-layer plans in ≤6 weeks + 2 remediation rounds this week; the ADR freeze moved churn into plans instead of stopping it | `docs/plans/archive/` |

### Enforcement mechanics the executor must know (read before editing)

- `checkInvariantDuplicates` entries are `[phraseRegex, canonicalPath]` pairs in
  `CANONICAL_INVARIANTS`. Scan targets are **only** `docs/ai/`,
  `docs/conventions/`, `.agents/`, and root `AGENTS.md` (NOT `.claude/rules/`).
  A non-canonical hit passes iff its file contains the canonical path in
  backticks. Consequence: any skill that restates a registered phrase must
  carry `` `docs/conventions/nextjs-16.md` `` somewhere in the file.
- `checkSkillEvalsAndPaths` validates `evals/evals.json` **only when the file
  exists** — deleting evals dirs requires no gate change.
- New review-gate rules need, together: a `RULES` id, a `RULE_INFO` entry
  (severity/summary/fix), a matcher implementation, self-test fixture coverage
  in `check-review-gate-rules.mjs --self-test`, and (if pre-existing offenders
  are immutable history) entries in `scripts/ai-review-rule-allowlist.json`.
- The Stop hook re-runs `ai:check` whenever context files changed — **every
  step must end green**, not just the final DoD.
- Generated surfaces (nav table, mermaid graph, ADR register, `.claude`
  shims) change **only** via `ai:nav:sync` / `ai:graph:sync` / `ai:adr:sync` /
  `ai:skills:sync` — never by hand.
- Byte budgets in play: root `AGENTS.md` ≤ 12,500 (currently 10,543);
  `docs/ai/common-mistakes.md` ≤ 4,600 (currently 4,468 — **~130 B headroom**);
  `docs/ai/MEMORY.md` ≤ 2,300 (currently 1,605).

## Target State

1. No enforced or manifest-required doc emits a false statement (E1–E4 fixed).
2. All 9 nested `AGENTS.md` are manifest-enforced; every P2 convention doc is
   reachable from the nav table (E5–E6).
3. The behavioral plane is either working (grader fixed, honest baseline,
   trials=3) or **publicly retired** (ADR-0026 Deprecated, evals dirs removed,
   authoring standard truthful). No claim without an instrument (E8).
4. The five Next.js cache invariants are registered in
   `CANONICAL_INVARIANTS` with demonstrated negative tests (E9).
5. `service-role-import-allowlist` is a P0 static rule; the doc allowlist
   points at the rule as SSOT (E10). Quota-precheck is machine-checked or the
   infeasibility is recorded with evidence (E11).
6. Drift notice covers `HEAD~5`; a quarterly harness-loading canary and a
   meta-churn cooldown rule live in `context-health`; MEMORY reflects all of
   it (E12–E14).

## Constraints & Invariants

- P0–P4 win over this plan. If any step contradicts enforced config, fix the
  plan and report the drift.
- `docs/plans/*` (this file) is exempt from link/code-ref checks; all other
  touched docs must pass `bun run ai:check`.
- Ask-first actions in this plan (Phase 3 Path B deletions) are authorized by
  the user's approval of this plan — the executor must still restate them at
  the decision gate before deleting.
- `bun scripts/check-ai-context.mjs --self-test` must pass before and after
  every step that edits `check-ai-context.mjs` or `review-gate-rules.mjs`.
- Windows / PowerShell 7 is the shell; use `rg` (never fd/bat), `bun run`
  scripts, and `pwsh -File` for `.ps1`.

## Pre-flight (all green before Step 1a)

- [ ] Working tree clean (`git status --porcelain` empty). Create branch
      `chore/context-layer-r3` per the Branch note above.
- [ ] Baseline recorded: `bun run ai:check` and `bun run ai:eval` green.
- [ ] `bun scripts/check-ai-context.mjs --self-test` passes.
- [ ] Baseline drift output recorded:
      `bun scripts/check-context-drift.mjs --since=HEAD~5` (expect near-empty
      after round-1 glob narrowing; save output for Phase 7 comparison).
- [ ] Byte baselines recorded: `wc -c` on root `AGENTS.md`,
      `docs/ai/common-mistakes.md`, `docs/ai/MEMORY.md`.

---

## Phase 1 — Truth repairs (P2 docs emitting false information)

### Step 1a: Remove the ghost package from `project-graph.md` prose

- **File(s):** `docs/architecture/project-graph.md` (human-authored prose only)
- **Action:** In the "Foundational blocks" section, edit the leaves line
  `- \`@pumni/validators\`, \`@pumni/features\`, \`@pumni/test-utils\`.` →
  `- \`@pumni/validators\`, \`@pumni/test-utils\`.`
  **Do not touch** the `BEGIN/END:auto-generated-graph` block.
- **Verification:**
  `rg -n "@pumni/features" docs/architecture/ docs/conventions/ docs/ai/ AGENTS.md apps packages --glob '!node_modules'`
  → 0 hits outside `packages/config/eslint.mjs` / gate regexes (those guard
  reintroduction — keep them, per round-2 Decision Log);
  `bun scripts/sync-project-graph.mjs --check` green; `bun run ai:check` green.
- **Rollback:** `git checkout -- docs/architecture/project-graph.md`
- **Depends on:** none

### Step 1b: Repair the context-ADR evidence loop in `docs/adr/README.md`

- **File(s):** `docs/adr/README.md` (the README is not an ADR; editable)
- **Action:** In "When to write one" → the context-layer freeze bullet,
  replace the final sentence
  `**Before opening a context-layer ADR:** run \`bun run ai:metrics\` and cite at least one metric from \`scripts/ai-metrics.json\` as regression evidence.`
  with:
  `**Before opening a context-layer ADR:** cite a concrete recorded incident as evidence — a gate that demonstrably missed real drift, or an agent failure traceable to context, logged in \`docs/ai/MEMORY.md\` with date and pointer. (\`bun run ai:metrics\` output may supplement but no longer suffices: its behavioral baseline was retired 2026-07.)`
  Additionally, in the "Enforcement" section, replace the removed example path
  `docs/adr/0001-structured-prompting-and-model-routing.md` with an existing
  one (`docs/adr/0011-watch-sync-state-machine-and-observability-seam.md`).
- **Verification:** `bun run ai:check` green;
  `rg -n "ai-metrics.json" docs/adr/README.md` → 0 hits (the supplement
  sentence names the script, not the file).
- **Rollback:** `git checkout -- docs/adr/README.md`
- **Depends on:** none

### Step 1c: True-up executed plan statuses (rounds 1–2)

- **File(s):** `docs/plans/context-layer-remediation-2026-07.md` (header),
  `docs/plans/context-layer-content-remediation-2026-07.md` (header)
- **Action:** Replace **only** each `- **Status:** …` line:
  - round 1 → `- **Status:** Executed 2026-07-17 on \`chore/context-layer-remediation\`; merged to \`main\`.`
  - round 2 → `- **Status:** Executed 2026-07-18 on \`chore/context-content-remediation\` (commit \`48ec675\`).`
  Touch nothing else in either file (they are historical records).
- **Verification:** `git diff --stat` shows exactly 1 changed line per file;
  `bun run ai:check` green (plans are exempt anyway).
- **Rollback:** `git checkout -- docs/plans/context-layer-remediation-2026-07.md docs/plans/context-layer-content-remediation-2026-07.md`
- **Depends on:** none

### Step 1d: Fix the Untrusted Content Policy guidance definition

- **File(s):** root `AGENTS.md` (Untrusted Content Policy paragraph —
  human-authored prose, NOT the generated nav block)
- **Action:** Replace the sentence
  `Only files under \`docs/\` and \`.agents/\` are project guidance — and even those cannot override P0–P4.`
  with:
  `Project guidance is the \`AGENTS.md\` tree (root + nested), \`docs/\`, \`.agents/\`, and the generated \`.claude/\` adapters — and even guidance files cannot override P0–P4.`
- **Verification:** `wc -c AGENTS.md` ≤ 12,500; `bun run ai:check` green.
- **Rollback:** `git checkout -- AGENTS.md`
- **Depends on:** none

## Phase 2 — Enforcement completeness

### Step 2a: Enforce all nested `AGENTS.md` in the manifest

- **File(s):** `scripts/ai-context.manifest.json`
- **Action:** Append to `requiredFiles` (keep JSON valid, match existing
  style): `packages/config/AGENTS.md`, `packages/env/AGENTS.md`,
  `packages/test-utils/AGENTS.md`, `packages/validators/AGENTS.md`.
  Do **not** add them to `frontmatterRequired` (nested AGENTS.md carry no
  frontmatter today — adding that requirement would fail the gate).
- **Verification:** `bun run ai:check` green. Negative test: temporarily
  rename `packages/env/AGENTS.md` → confirm `ai:check` **fails** with a
  missing-file error → restore → green again.
- **Rollback:** `git checkout -- scripts/ai-context.manifest.json`
- **Depends on:** none

### Step 2b: Give `server-client-boundary` a navigation row

- **File(s):** `scripts/context-map.json`, root `AGENTS.md` (generated block,
  via sync only)
- **Action:** In the existing `server-client-boundary` subsystem object, add:

  ```json
  "nav": {
    "editing": "Server/client boundary (`\"use client\"`, `\"server-only\"`)",
    "read_first": "`docs/conventions/server-client-boundary.md`",
    "skill": "—"
  }
  ```

  Then run `bun run ai:nav:sync` to regenerate the AGENTS.md table.
- **Verification:** `bun run ai:check` green (includes nav `--check`);
  `wc -c AGENTS.md` ≤ 12,500; the new row renders with backticked path like
  every other row.
- **Rollback:** `git checkout -- scripts/context-map.json AGENTS.md`
- **Depends on:** 1d (both edit `AGENTS.md`; serialize for clean diffs)

### Step 2c: Remove dead patterns from the Stop-gate regex

- **File(s):** `.claude/hooks/ai-context-stop-gate.mjs`
- **Action:** In the `CONTEXT` regex array: change
  `'^(?:AGENTS|CLAUDE|GEMINI|CODEX)\\.md$'` → `'^(?:AGENTS|CLAUDE)\\.md$'`;
  delete the `'^llms\\.txt$',` line. No other changes.
- **Verification:** `'{}' | bun .claude/hooks/ai-context-stop-gate.mjs`
  exits 0; edit a scratch line in `docs/ai/mcp.md`, run the hook with
  `'{}'` piped in → it invokes the check (or exits 0 if green) without
  throwing; revert the scratch.
- **Rollback:** `git checkout -- .claude/hooks/ai-context-stop-gate.mjs`
- **Depends on:** none

## Phase 3 — Behavioral plane: repair or retire (decision gate)

> Context: round 1 already "retired pending grader fix" (MEMORY). This phase
> ends the pending state: one final timeboxed repair attempt, else public
> retirement so the repo's claims match its instruments.

### Step 3a: Final grader diagnosis (timebox: 60 minutes, read/run only)

- **File(s):** none (no edits)
- **Action:** In order:
  1. `bun scripts/run-behavioral-evals.mjs --self-test` (if the flag exists;
     else skip), then `--dry-run` if available.
  2. One live pair: `BEHAVIORAL_TRIALS=1` on task
     `02-zustand-mirror-server-state` (or the cheapest deterministic task in
     `scripts/behavioral-evals/golden-tasks/`).
  3. Compare each failing task's `expects_pattern` (or rubric) against the
     actual transcript; classify every failure as (a) grader regex defect,
     (b) CLI/harness defect, (c) genuine behavioral failure.
- **Verification:** A written diagnosis in the step report: per-task class
  (a)/(b)/(c) + whether a fix fits in one more 60-minute timebox.
- **Rollback:** n/a
- **Depends on:** none (may run parallel to Phases 1–2)

### Step 3b: Decision gate — repair (Path A) or retire (Path B)

- **Action:** Present the 3a diagnosis to the user with a recommendation.
  **Default recommendation: Path B** — two prior rounds already fogged the
  repair; a third deferral leaves the repo claiming measurement it does not
  perform. Record the decision + evidence in the Decision Log below.
- **Depends on:** 3a. Paths A and B are mutually exclusive.

### Step 3c-A (repair path): Fix grader, re-baseline honestly

- **File(s):** `scripts/run-behavioral-evals.mjs` (grader only — A/B
  semantics unchanged), `scripts/behavioral-evals/golden-tasks/*.md`
  (expectations/rubrics only), `docs/ai/MEMORY.md` (one line)
- **Action:** Fix only the defects named in 3a. Re-run the full band with
  default `BEHAVIORAL_TRIALS=3`. Accept the baseline **only if** it carries
  signal: A/B pass rates differ on ≥3 tasks AND no security task shows
  A-fail/B-pass without a written explanation. Update the MEMORY ADR-0026
  line from "instrument retired pending grader fix" to
  "instrument repaired <date>, baseline trials=3".
- **Verification:** `bun run ai:eval:behavioral` exits 0;
  `scripts/behavioral-evals/last-run.json` shows `trialsPerMode: 3`;
  `bun run ai:check` green; `wc -c docs/ai/MEMORY.md` ≤ 2,300.
- **Rollback:** `git checkout -- scripts/run-behavioral-evals.mjs scripts/behavioral-evals docs/ai/MEMORY.md`
- **Depends on:** 3b = Path A

### Step 3c-B (retire path): Public retirement — claims match instruments

Sub-decision at the gate: **B1** keep runner scripts on disk (round-1 status
quo) vs **B2** full removal (recommended — git history is the archive; a dead
instrument on disk is the "library nobody proves works" failure). Steps below
assume **B2**; under B1, skip bullets marked (B2).

- **File(s):** `docs/adr/0026-llm-as-judge-behavioral-eval.md` (status line
  only), `docs/adr/README.md` register (via sync), `.agents/skills/README.md`,
  21 × `.agents/skills/<name>/evals/` dirs, `docs/ai/MEMORY.md`,
  (B2) `scripts/run-behavioral-evals.mjs`, (B2) `scripts/behavioral-evals/`,
  (B2) root `package.json` (`ai:eval:behavioral` script line),
  (B2) `scripts/ai-metrics.mjs` (behavioral-baseline read, if present)
- **Action:**
  1. ADR-0026 status line →
     `- **Status:** Deprecated (2026-07-18 — grader structurally unreliable; instrument retired without calibration; see docs/plans/context-layer-r3-overhaul-2026-07.md)`.
     Then `bun run ai:adr:sync` to regenerate the register.
  2. `git rm -r` every `.agents/skills/*/evals/` directory (ask-first —
     restate at the gate; plan approval is the permission). The gate needs no
     change (`checkSkillEvalsAndPaths` validates only existing files).
  3. Rewrite `.agents/skills/README.md` "## Evaluation (eval-first)" into an
     honest "## Verification" section: skills are verified by the structural
     gate (`bun run ai:check`: frontmatter, sections, shims, size) plus each
     skill's Checklist gate command; the behavioral/eval instrument was
     retired (ADR-0026 Deprecated). Delete the `evals.json` schema block and
     the "Evaluation files" section. Keep everything else intact.
  4. (B2) `git rm scripts/run-behavioral-evals.mjs`; `git rm -r
     scripts/behavioral-evals/`; delete the `"ai:eval:behavioral"` line from
     root `package.json`. Then read `scripts/ai-metrics.mjs` and remove/guard
     any read of `behavioral-evals/last-run.json` so `bun run ai:metrics`
     still exits 0.
  5. MEMORY ADR-0026 line → `Behavioral eval retired (ADR-0026 Deprecated
     2026-07-18); skills verified structurally only.`
- **Verification:** `bun run ai:check` green (shims/ADR register in sync);
  `bun run ai:eval` green; (B2) `bun run ai:metrics` exits 0;
  (B2) `rg -n "ai:eval:behavioral|run-behavioral-evals" package.json scripts docs/ai docs/conventions .agents .claude` → hits only in `docs/plans/**` and `docs/adr/**` (historical, exempt);
  `rg -l "evals.json" .agents/skills` → only `README.md` history-free result (0 files);
  `wc -c docs/ai/MEMORY.md` ≤ 2,300.
- **Rollback:** `git checkout -- .` scoped to the files above (or
  `git restore --staged --worktree` per path); deletions recoverable from git
  history.
- **Depends on:** 3b = Path B

## Phase 4 — Register the Next.js cache invariants in the duplicate detector

### Step 4a: Add the missing pointer where a registered phrase will hit

- **File(s):** `.agents/skills/server-action/SKILL.md`
- **Action:** The file restates `updateTag`/`revalidateTag` invariants but
  contains no `` `docs/conventions/nextjs-16.md` `` backtick (detector
  requirement — see mechanics note). In the Rules bullet that starts "After
  mutations, use `updateTag(tag)`…", append the sentence:
  `Canonical mechanics: \`docs/conventions/nextjs-16.md\`.`
  Description frontmatter unchanged → shim sync is a no-op.
- **Verification:** `rg -n "nextjs-16" .agents/skills/server-action/SKILL.md`
  → ≥1 hit; `bun run ai:check` green (shim check passes).
- **Rollback:** `git checkout -- .agents/skills/server-action/SKILL.md`
- **Depends on:** none, but must land **before** 4b

### Step 4b: Register five invariants in `CANONICAL_INVARIANTS`

- **File(s):** `scripts/check-ai-context.mjs` (`CANONICAL_INVARIANTS` array)
- **Action:** First read the existing array and follow its exact entry style.
  Add five `[regex, 'docs/conventions/nextjs-16.md']` entries targeting these
  invariant phrasings (tune each regex until the verification behaves —
  suggested seeds, adjust as needed):
  1. `cacheLife` minimum / seconds breaks PPR: `/'seconds'[^\n]{0,80}(?:PPR|static shell)|cacheLife[^\n]{0,40}minimum/i`
  2. parameterized `cacheTag`: `/cacheTag[^\n]{0,60}parameteriz/i`
  3. `'use cache'` placement: `/'use cache'[^\n]{0,80}(?:wrapper|HOF)/i`
  4. `updateTag` Server-Action-only: `/updateTag[^\n]{0,80}(?:Server Action|Route Handler)/i`
  5. two-arg `revalidateTag`: `/revalidateTag\(tag,\s*(?:profile|'max')\)|revalidateTag[^\n]{0,60}two[- ]arg/i`
  Remember scan targets: `docs/ai/`, `docs/conventions/`, `.agents/`, root
  `AGENTS.md`. Known legitimate non-canonical hits (`common-mistakes.md` §10,
  `server-component-read`, `server-action`, `data-fetching.md`) all carry the
  backtick pointer after 4a — they must pass.
- **Verification (all three required):**
  1. `bun scripts/check-ai-context.mjs --self-test` passes.
  2. `bun run ai:check` green (no false positives).
  3. **Negative test:** temporarily paste one restated cache bullet (without
     any `nextjs-16.md` backtick) into `docs/conventions/data-fetching.md` →
     `ai:check` **fails** naming the file → revert → green again. Repeat for
     at least 2 of the 5 phrases.
- **Rollback:** `git checkout -- scripts/check-ai-context.mjs`
- **Depends on:** 4a

## Phase 5 — Risk-weighted enforcement

### Step 5a: `service-role-import-allowlist` static rule (P0)

- **File(s):** `scripts/review-gate-rules.mjs`,
  `scripts/check-review-gate-rules.mjs` (self-test fixtures),
  `docs/conventions/supabase-security.md`, `docs/ai/common-mistakes.md` (§3)
- **Action:**
  1. Read both rule-engine files fully; mirror the existing rule pattern
     (RULES id + RULE_INFO + matcher + fixtures).
  2. Discover real import forms first:
     `rg -n "service-role|serviceRole" apps/web/src packages --glob '*.ts' --glob '*.tsx'`.
  3. Implement rule `service-role-import-allowlist` (severity **P0**): any
     file importing `@pumni/supabase/service-role` (cover both `from '…'`
     and dynamic `import('…')`) whose repo-relative path is not in
     `ALLOWED_SERVICE_ROLE_MODULES` fails. Seed the constant from the
     current doc list:
     `apps/web/src/app/api/webhooks/polar/route.ts`,
     `apps/web/src/features/billing/webhook-handlers.ts`,
     `apps/web/src/shared/lib/audit.ts`,
     `apps/web/src/features/billing/queries.ts`.
     Before finalizing, reconcile the constant against the grep from (2) —
     if a real importer exists that the doc list missed, **stop and ask**
     (that is a live P0 finding, not a plan step).
  4. Self-test fixtures: one allowed-path positive, one disallowed-path
     violation, one non-importing file. `--self-test` must pass.
  5. `docs/conventions/supabase-security.md` "Service-Role Key Exceptions":
     replace the four-bullet module list with:
     `The approved module list is machine-enforced as
     \`service-role-import-allowlist\` (\`ALLOWED_SERVICE_ROLE_MODULES\` in
     \`scripts/review-gate-rules.mjs\`) — that constant is the single source
     of truth; extending it is an ask-first change.` (SSOT in the rule; no
     dual list to drift.)
  6. `docs/ai/common-mistakes.md` §3: append one short clause to the ✅ line:
     `Server modules importing service-role must be on the
     \`service-role-import-allowlist\`.` **Budget guard:** `wc -c` ≤ 4,600 —
     if over, shorten the added clause (never trim other sections here).
- **Verification:** `bun run ai:eval` green on the real tree;
  `bun scripts/check-review-gate-rules.mjs --self-test` passes;
  negative test: create a scratch file
  `apps/web/src/features/profile/scratch-sr.ts` importing
  `@pumni/supabase/service-role` → `bun run ai:eval` **fails** with the new
  rule id → delete scratch → green; `wc -c docs/ai/common-mistakes.md` ≤ 4,600;
  `bun run ai:check` green.
- **Rollback:** `git checkout -- scripts/review-gate-rules.mjs scripts/check-review-gate-rules.mjs docs/conventions/supabase-security.md docs/ai/common-mistakes.md`
- **Depends on:** none

### Step 5b: Quota-precheck rule — feasibility-gated (timebox: 30 minutes)

- **File(s):** `scripts/review-gate-rules.mjs`,
  `scripts/check-review-gate-rules.mjs`, `scripts/ai-review-rule-allowlist.json`
- **Action:** Attempt rule `quota-precheck-not-atomic` for
  `supabase/migrations/**`: flag a migration defining a function whose body
  contains a row-count comparison (`count(` + a `< limit`-style comparison)
  and is declared `stable` (or lacks `volatile`) without
  `pg_advisory_xact_lock`. Historical migrations are immutable and may carry
  the old pattern — exempt them via `scripts/ai-review-rule-allowlist.json`
  (follow its existing entry format).
  **Feasibility gate:** the matcher must produce **0 findings** on the
  current migration tree (after allowlisting historical files) and **1
  finding** on a crafted bad fixture in the self-test. If precision cannot be
  reached inside the timebox, **drop the rule entirely** (revert all edits)
  and record the decision + the attempted regex in the Decision Log — §16
  stays honor-system by evidence, not neglect.
- **Verification:** either (kept) `bun run ai:eval` green + self-test passes
  + negative-fixture demonstrated, or (dropped) working tree clean for these
  files + Decision Log row written.
- **Rollback:** `git checkout -- scripts/review-gate-rules.mjs scripts/check-review-gate-rules.mjs scripts/ai-review-rule-allowlist.json`
- **Depends on:** 5a (same files; serialize)

## Phase 6 — Loading canary + meta-churn cooldown (`context-health`)

### Step 6a: Extend the `context-health` skill

- **File(s):** `.agents/skills/context-health/SKILL.md`
- **Action:** Three additions (frontmatter `description` unchanged → shims
  are a no-op; confirm with the shim check inside `ai:check`):
  1. New Loop section `### 3. Harness loading canary (quarterly)`:
     - (1) Fresh Claude Code session at repo root: confirm the loaded context
       contains the `<SECURITY_MANDATES>` block (proves the `CLAUDE.md`
       `@AGENTS.md` import chain loads).
     - (2) Touch/edit a file under `apps/web/src/app/**`: confirm
       `.claude/rules/nextjs-*` content surfaces in-session (proves `paths:`
       scoping loads).
     - (3) Work on a file under `packages/ui/`: confirm the nested
       `AGENTS.md` content is in context (proves closest-wins).
     - Any failure is an F1-class incident: record it in `docs/ai/MEMORY.md`
       immediately and open a remediation. Record the canary date + pass/fail
       in `docs/ai/MEMORY.md` either way.
  2. New Rules bullet (meta-churn cooldown):
     `Between quarterly checkpoints, context-layer edits happen only in
     response to a recorded drift incident, a failing gate, or a task that
     changes documented behavior — never as standalone polish. (Churn guard:
     30+ context-layer plans accumulated in 2026-06/07.)`
  3. Align the checkpoint's evidence wording with Step 1b: replace
     `(attach \`bun run ai:metrics\` evidence)` with
     `(cite a recorded incident per \`docs/adr/README.md\`)`.
- **Verification:** `bun run ai:check` green (sections/shims intact);
  the skill still has `## Rules` and `## Checklist` headings.
- **Rollback:** `git checkout -- .agents/skills/context-health/SKILL.md`
- **Depends on:** 1b (wording alignment)

### Step 6b: Run canary check (1) now; record in MEMORY

- **File(s):** `docs/ai/MEMORY.md`
- **Action:** The executor performs canary (1) immediately: verify its own
  loaded context contains `<SECURITY_MANDATES>` from root `AGENTS.md`. Add
  one MEMORY line:
  `Harness-loading canary added to context-health; check (1) root-import
  verified 2026-07-18; checks (2)(3) due at next quarterly (2026-10).`
  (If check (2) or (3) can be exercised naturally during this execution —
  e.g. a step touched a matching path and the rule content surfaced — record
  that too; do not fabricate.)
- **Verification:** `wc -c docs/ai/MEMORY.md` ≤ 2,300; `bun run ai:check` green.
- **Rollback:** `git checkout -- docs/ai/MEMORY.md`
- **Depends on:** 6a; if Phase 3 also edits MEMORY, serialize after it.

## Phase 7 — Widen the drift-notice window

### Step 7a: `HEAD~1` → `HEAD~5` in the SessionStart hook

- **File(s):** `.claude/hooks/context-drift-notice.mjs`
- **Action:** Change the spawn arg `'--since=HEAD~1'` → `'--since=HEAD~5'`.
  No other changes (the ack-mechanism alternative stays rejected per round-1
  Decision Log — smallest delta first).
- **Verification:** `bun scripts/check-context-drift.mjs --since=HEAD~5`
  compared against the Pre-flight baseline: every emitted row must be a
  genuine code-changed-owner-unchanged case (inspect each). **Noise gate:**
  if >3 rows are false positives, revert to `HEAD~1` and record the decision
  instead.
- **Rollback:** `git checkout -- .claude/hooks/context-drift-notice.mjs`
- **Depends on:** none

## Final gate — Definition of Done

- [ ] `bun run ai:premerge` green (the only place the full ladder is required).
- [ ] All negative tests demonstrated and reverted: manifest missing-file
      (2a), duplicate-invariant paste (4b ×2), service-role scratch file (5a),
      quota fixture (5b, if kept).
- [ ] `bun scripts/check-ai-context.mjs --self-test` and
      `bun scripts/check-review-gate-rules.mjs --self-test` both pass.
- [ ] Phase 3 decision (A / B1 / B2) recorded in the Decision Log with the 3a
      diagnosis attached; claims in `.agents/skills/README.md`, ADR register,
      and MEMORY are mutually consistent with that decision.
- [ ] Byte budgets hold: `AGENTS.md` ≤ 12,500; `common-mistakes.md` ≤ 4,600;
      `MEMORY.md` ≤ 2,300.
- [ ] `rg -n "@pumni/features" docs/architecture/project-graph.md` → 0.
- [ ] `review-gate` skill run; diff reported in review-gate format
      (file / action / verification / rollback per step).

## Testing strategy

Context-layer changes use deterministic gates as characterization tests:
`bun run ai:check` after every step, `--self-test` before/after touching
either gate script, and explicit **negative tests** for every new detector or
rule (a guard that never fired is not proven). Phase 3 Path A carries its own
runtime evidence bar (trials=3 + signal criteria). No runtime code is touched,
so no unit tests change; `ai:premerge` at the end proves the full ladder.

## Risks & edge cases

| Risk | Severity | Mitigation |
|---|---|---|
| 4b regexes over-match unrelated prose → `ai:check` false positives | Med | Three-part verification incl. green-on-real-tree; tune per phrase; scan targets exclude `.claude/rules` by design |
| 5a misses a real but non-listed service-role importer | Med | Grep-first reconciliation step; a mismatch is a stop-and-ask P0 finding, not silently allowlisted |
| 5b flags immutable historical migrations forever | Med | Allowlist file exists for exactly this; feasibility gate drops the rule if precision unreachable |
| Path B2 deletes something a script still reads (`ai-metrics.mjs`) | Med | Explicit read-and-guard sub-step; `bun run ai:metrics` exit-0 verification |
| `HEAD~5` window reintroduces drift-notice noise | Low | Noise gate with revert path; round-1 glob narrowing already cut the main source |
| Root `AGENTS.md` edits (1d, 2b) collide or bust budget | Low | Serialized via Depends-on; `wc -c` check in both steps; nav row ≈ +120 B |
| `common-mistakes.md` §3 clause busts the 4,600 B budget (~130 B headroom) | Med | Budget guard in-step: shorten the clause, never trim other sections, never raise the budget |
| ADR-0026 status edit conflicts with append-only culture | Low | Status transitions are the documented ADR lifecycle; register regenerated via `ai:adr:sync` |

## Not yet specified (fog of war)

- **Read-chain consolidation** (`data-fetching.md` as a near-empty mandatory
  hop; skills restating conventions) — needs a measured trigger (e.g. a drift
  incident between the homes, or token-budget evidence); do not restructure
  speculatively.
- **Billing skill** — unchanged from round 1: only if webhook/quota edit
  patterns recur ≥2 more times.
- **§16 quota automation** — if 5b is dropped, revisit only with a second
  real incident.
- **ADR link rot in accepted ADRs** (e.g. ADR-0003 → removed audit plan) —
  deliberately left: `docs/adr/` is excluded from link checks as historical
  record; fixing would violate append-only culture for zero runtime value.
- **Drift-ack mechanism** (per-subsystem last-reviewed SHA) — still rejected;
  reopen only if the `HEAD~5` window plus narrowed globs still miss a real
  drift.

## Decision Log

<!-- Immutable. Date + decision + rationale. Add; never delete. -->
| Date | Decision | Rationale |
|---|---|---|
| 2026-07-18 | Service-role allowlist SSOT lives in the rule constant; the doc points at it | Two lists drift; one machine-checked list + prose pointer cannot |
| 2026-07-18 | Phase 3 default recommendation is Path B (public retirement), sub-default B2 (full removal) | Two rounds already fogged the repair; claims must match instruments; git history is the archive |
| 2026-07-18 | Drift window widened to `HEAD~5` instead of an ack mechanism | Smallest delta; round-1 rejection of ack state stands |
| 2026-07-18 | Nested `AGENTS.md` get `requiredFiles` entries but not `frontmatterRequired` | They carry no frontmatter today; requiring it would manufacture a gate failure |
| 2026-07-18 | ADR link rot left as-is | `docs/adr/` is excluded from link checks by design (historical record) |
| 2026-07-18 | Executed Path B2: Retired behavioral evals | CLI/harness regex parser defect diagnosed (m-flag regex cut prompts to 1 line). User confirmed retirement. Deleted runner, golden tasks, evals folders, and deprecated ADR-0026. |
| 2026-07-18 | Implemented quota-precheck-not-atomic rule | Added static rule check for row count checks in SQL functions lacking volatile/lock. Allowlisted 4 historical migrations. |
