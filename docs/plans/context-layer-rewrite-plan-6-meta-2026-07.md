# Plan 6 — Enforcement & Meta Machinery Right-Sizing

**Depends on:** Plan 5. Master: `context-layer-rewrite-master-2026-07.md`.
**Goal:** The gate machinery matches the new architecture, locks the rewrite
in (so F1-class failures can never recur silently), and shrinks to its
load-bearing core. Fixes: F9, F16, F17 (final), closes Q3/Q13.

**Non-goals:** new rule *domains* in the static analyzer; behavioral-eval
changes (ADR-0026 stands); CI topology changes beyond listed tweaks.

**Gate:** `bun run ai:check && bun run ai:eval` per step; `ai:premerge` close.

## Pre-flight

- [ ] Plan 5 DoD confirmed; `bun run ai:premerge` green.
- [ ] `bun run ai:metrics -- --json > before.json` snapshot for the ADR record.

## Steps

1. **New gate checks in `check-ai-context.mjs`** (each with a self-test case):
   a. `checkClaudeShims` — root `CLAUDE.md` starts with `@AGENTS.md`; every
      dir with `AGENTS.md` has the generated shim; shims contain exactly the
      expected line. **This is the check that would have caught F1.**
   b. `checkEncodingHygiene` — context tree (manifest files + `.agents/` +
      nested AGENTS.md) contains no U+FFFD and no unexpected CJK (allowlist
      hook for legitimate use). Catches F5/F12 class.
   c. Absorb skill-health machine steps: skill-referenced path existence and
      `evals.json` schema (skill_name + evals[]) — extend the existing
      structured-markdown/skill checks rather than new scripts.
   d. Tighten `checkInvariantDuplicates` to the audit §6 rule: an invariant
      body-sentence may appear in exactly one canonical + one root P0 line +
      one-line nested deltas; fail on paragraph-level duplication elsewhere.
      Start in warn mode, flip to fail once clean.
   Verify: `bun run ai:check` (self-tests pass; repo clean against new checks).

2. **Navigation single-source (Q13, F16).**
   a. Dedupe `context-map.json`: merge `supabase-rls` into `supabase-security`;
      add missing subsystems if the nav table has rows without a map entry
      (e.g. `nextjs-16` owner row).
   b. New `scripts/sync-nav-table.mjs` (`ai:nav:sync`): renders the root
      `AGENTS.md` navigation-table block between
      `BEGIN/END:auto-generated-nav` markers from `context-map.json` +
      a small static-rows config (glossary, mistakes, skills dir) — the
      project-graph pattern. Convert the hand-written Plan-1 table to the
      generated block (content should be near-identical).
   c. Gate: `checkNavMapSync` fails when regeneration would differ.
   d. Document context-map in one line inside the root source-of-truth
      section ("machine map: `scripts/context-map.json` — edit it, then
      `bun run ai:nav:sync`").
   Verify: sync idempotent; `bun run ai:check`.

3. **Decouple `ai:tw` from `ai:check`** (altitude fix): `ai:check` = context
   gate only; `ai:tw` moves into `lint` (or stays a sibling invoked by
   `ai:premerge` explicitly). Update root gate-ladder line, hook comment, CI
   steps if they named the coupling.
   Verify: `bun run ai:premerge` (must still run both).

4. **Metrics prune (Q3, F9).** Keep: `totalSizeBytes`/`contextDocsBytes`,
   `invariantDuplicateCategories`, `manifestItemCount`,
   `commonMistakesEnforcementGap`, `skillCount`, `behavioralBaseline`.
   Drop: `toolMatrixMismatches` (matrix deleted), `adrMetaRatio`,
   `skillOverlapPairs`, `skillNegativeClauseCoverage`, `adrDocsBytes`,
   `adrActiveCount`/`adrDeprecatedCount`, `docCount` (derivable). Trim
   `ai-metrics.mjs` + regenerate `ai-metrics.json`; update `docs-health.yml`
   comment if it names dropped metrics.
   Verify: `bun run ai:metrics` clean; docs-health workflow steps unaffected.

5. **Repo hygiene.** Delete `scripts/PLAN_baseline_2026-07-08T00-00-00.json`;
   gitignore `scripts/behavioral-evals/last-run.json` (and `git rm --cached`).
   Update `.fallowrc.jsonc` `entry` list for any renamed/added scripts
   (`sync-nav-table.mjs`, shim sync). Reconcile the review-gate self-test
   (`check-review-gate-rules.mjs`) if any rule-id/doc coupling changed in
   Plans 2–3.
   Verify: `bun run ai:eval` (self-test), `bun run fallow:audit` locally.

6. **Manifest final pass + budgets (F17 final).** Remove dead keys
   (`indexRequiredReferences` if still present), recount `requiredFiles`
   against the real tree, set every `sizeBudgets` entry = current size × 1.2.
   Verify: `bun run ai:check`.

7. **Close the rewrite.**
   - `bun run ai:premerge` full green.
   - `bun run ai:metrics -- --json > after.json`; paste before/after deltas
     into ADR-0027 (Consequences → evidence): expected direction —
     contextDocsBytes ↓, invariantDuplicateCategories ↓, permanent-load bytes
     within Q1 budget.
   - Manual end-to-end smoke (three sessions): docs-only (root only, no
     Next.js rules), app-code touch (nested shim + rule fire), migration touch
     (supabase rule + skill fire).
   - Move all six plan files + master to `docs/plans/archive/`; MEMORY.md
     final entry; update memory of maintenance cadence (quarterly
     `context-health`).

## Definition of done

- [ ] New checks live with self-tests; a re-broken `CLAUDE.md` import now
      fails `ai:check`.
- [ ] Nav table auto-generated from deduped context-map; sync idempotent.
- [ ] Metrics file lists only the kept set; stray run artifacts gone from git.
- [ ] Manifest matches the real tree; all budgets have ~20% headroom.
- [ ] Three-session smoke passes; ADR-0027 complete with metric evidence.
- [ ] Plans archived; `bun run ai:premerge` green on a clean checkout.

## Risks

| Risk | Severity | Mitigation |
|---|---|---|
| New duplicate-check too strict → noisy failures | M | Warn-mode first (step 1d), flip after a clean sweep |
| Nav generation fights hand-edits to root | M | Markers + `checkNavMapSync` make drift loud; static rows live in config, not the md |
| Metrics prune deletes a number someone graphs from docs-health artifacts | L | 90-day artifacts retain old snapshots; ADR-0027 notes the schema change |
