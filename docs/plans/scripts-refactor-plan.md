---
description: Execution plan to refactor the scripts layer — remove dead/inconsistent scripts, clean unused npm script aliases, fix bugs, and reduce over-engineered script files. Covers root package.json, apps/web/package.json, packages/*/package.json, scripts/*, and CI workflows.
status: draft
owner: ai-agent
last-reviewed: 2026-06-26
---

# Scripts Layer Refactor Plan

## Problem Statement

The project has accumulated **19 root scripts**, **8 app scripts**, and **10 script files** across 4 layers. Several are:

1. **Buggy** — `test:unit` targets a non-existent directory; `behavioral-evals.yml` references 4 missing files.
2. **Redundant** — `ai:secrets`, `ai:review:static`, and `ai:tw:fix` are npm-script aliases for commands that are already called programmatically or are trivial flag variants.
3. **Inconsistent** — `test:unit` uses `bun test` while `test` uses `vitest`; the root `turbo test:unit` pipeline differs from `test` in dependency structure.
4. **Over-engineered** — `check-ai-context.mjs` (624 lines) bundles 14+ unrelated checks; `check-review-gate-rules.mjs` (985 lines) duplicates what ESLint plugins could cover.

## Non-Negotiable Invariants

- **CI contracts cannot break.** `ci.yml` and `docs-health.yml` define the deployment gate. Every change to a script they call must preserve exit-code semantics.
- **`requiredPackageScripts` in `ai-context.manifest.json`** must stay consistent with `package.json`. If a script is removed from `package.json`, remove it from the manifest too.
- **No script referenced in `.github/workflows/` can vanish without updating the workflow.** Workflow files that reference missing scripts must be fixed or removed.
- **Script files (`scripts/*.mjs`) are not deleted unless all consumers are updated.** Multiple scripts and workflows may reference the same file — verify `rg` before removing.
- **`turbo.json` tasks consumed by CI (`lint`, `typecheck`, `test`, `build`)** are untouched.
- The three `<SECURITY_MANDATES>` (P0) are out of scope — no script change touches Supabase keys, RLS, or server-only boundaries.

## Decisions Already Made (Do Not Re-Litigate)

1. **Keep `scripts/` as a flat directory.** The 10 `.mjs`/`.json` files are co-located by design (one manifest, one allowance list, 6 runner scripts, 2 registries). Do not add subdirectories.
2. **Keep `check-ai-context.mjs` as a single file.** Splitting its 14 checks into separate files (e.g. `check-markdown-links.mjs`, `check-frontmatter.mjs`) increases import overhead without changing the CI footprint. Instead, remove the least-impactful checks.
3. **Keep `review-gate-rules.mjs` separate from `check-review-gate-rules.mjs`** — the data/registry split is correct. Only the analyzer (985 lines) is in scope for trimming.
4. **Do NOT delete `scripts/run-behavioral-evals.mjs` from the behavioral-evals.yml trigger paths** — the workflow file itself may need removal. If the workflow stays, the trigger path stays.
5. **Keep the `preinstall` script.** `bunx only-allow bun` is a single line and enforces the documented package manager contract.

---

## Phase 0: Baseline

1. Record current state:
   - `git status --short` — capture dirty files before starting.
   - `bun --cwd apps/web test` — verify tests pass.
   - `bun --cwd apps/web typecheck` + `bun --cwd apps/web lint` — capture baseline.
   - `bun run ai:check` + `bun run ai:eval` — capture AI-gate baseline.

2. Create working branch:
   ```bash
   git checkout -b refactor/scripts-layer
   ```

**Acceptance:** A clean branch exists; baseline test/typecheck/lint/ai:eval output is captured.

---

## Phase 1: Fix Bugs (P0 equivalent)

**Why first**: Dead paths and missing files in CI scripts can silently fail or block merges. Fixing them first keeps the tree green for subsequent phases.

### 1a. Fix `test:unit` dead path in `apps/web/package.json`

**Problem:** `"test:unit": "bun test src/test/validators src/test/scripts"` — `src/test/scripts` **does not exist**. The only subdirectories under `src/test/` are `app-shell`, `design-system`, `features`, `validators`.

**Options:**
- **A (recommended):** Remove `src/test/scripts` from the command — change to `"bun test src/test/validators"`.
- **B:** Redirect to a real path — but there is no obvious "scripts" test directory to point at. (All test files live under `validators/`, `features/`, `design-system/`.)

Default: **A**.

**Files touched:**
- `apps/web/package.json:13`

**Verification:**
```bash
bun --cwd apps/web test:unit
# Should execute validators tests only, no "no files found" warning.
```

### 1b. Fix `behavioral-evals.yml` — missing files

**Problem:** `.github/workflows/behavioral-evals.yml` references:
- `scripts/run-behavioral-evals.mjs` ❌
- `scripts/eval-stub-agent.mjs` ❌
- `scripts/eval-agent.mjs` ❌
- `.agents/evals/` ❌

None of these exist. The workflow triggers on `workflow_dispatch` (manual) or PRs touching these paths — which never match, so the workflow is dead. If triggered manually, it fails.

**Options:**
- **A (recommended):** **Delete the workflow file.** The project has no behavioral eval infrastructure. The `ai:eval` script (deterministic checks in `run-ai-evals.mjs`) already covers the regression surface. The behavioral-evals concept was aspirational and never built — keeping the dead workflow is misleading.
- **B:** Keep the file but add stub `.mjs` files that exit 0, documenting they are placeholders. This adds noise without value.

Default: **A**.

**Files touched:**
- `.github/workflows/behavioral-evals.yml` (delete)

**Verification:**
```bash
Test-Path ".github/workflows/behavioral-evals.yml"  # → False
git diff --name-only | rg "behavioral-evals"  # → empty
```

### Phase 1 Acceptance
- `bun --cwd apps/web run test:unit` runs without "no files" error.
- `.github/workflows/behavioral-evals.yml` is removed.
- Existing `ci.yml` and `docs-health.yml` are untouched.

---

## Phase 2: Remove Redundant npm Scripts (Safe)

**Why second**: npm script aliases that are never called by other scripts or CI can be removed without any functional impact. The underlying script files remain — they are still called programmatically from `check-ai-context.mjs` and `run-ai-evals.mjs`.

### 2a. Remove `ai:secrets`

```json
"ai:secrets": "bun scripts/check-secrets.mjs"
```

- **Not called** by any other npm script (grep `"ai:secrets"` in `package.json` → only its own definition).
- Called **programmatically** by `check-ai-context.mjs` (line 323, `execFileSync`) and `run-ai-evals.mjs` (line 46, `execFileSync`).
- Referenced in docs (`review-gate.md` checklist) — update the doc to use `bun scripts/check-secrets.mjs` directly.

**Files touched:**
- Root `package.json` (remove `ai:secrets` entry)
- `.agents/workflows/review-gate.md` (replace `bun run ai:secrets` with `bun run scripts/check-secrets.mjs`)

### 2b. Remove `ai:review:static`

```json
"ai:review:static": "bun scripts/check-review-gate-rules.mjs"
```

- **Not called** by any other npm script.
- Called **programmatically** by `run-ai-evals.mjs` (line 43, `execFileSync`).
- No documentation references in `review-gate.md` or other docs.

**Files touched:**
- Root `package.json` (remove `ai:review:static` entry)

### 2c. Remove `ai:tw:fix`

```json
"ai:tw:fix": "tailwind-lint ... --fix"
```

- **Identical to `ai:tw`** except for the `--fix` flag.
- No CI script or workflow calls it.
- Users can run `bun run ai:tw -- --fix` if needed.
- Referenced in `docs/conventions/design-system.md` — update to suggest the `--fix` flag inline.

**Files touched:**
- Root `package.json` (remove `ai:tw:fix` entry)
- `docs/conventions/design-system.md` (change `bun run ai:tw:fix` → `bun run ai:tw -- --fix`)

### Phase 2 Acceptance

```bash
# Verify no residual references to removed scripts
rg '"ai:secrets"' package.json  # → empty
rg '"ai:review:static"' package.json  # → empty
rg '"ai:tw:fix"' package.json  # → empty

# Verify underlying script files still exist and are executable
Test-Path scripts/check-secrets.mjs  # → True
Test-Path scripts/check-review-gate-rules.mjs  # → True

# Verify ai:eval still works (it calls these programmatically)
bun run ai:eval  # → passes (same as baseline)

# Verify review-gate.md references the inline command
rg "check-secrets" .agents/workflows/review-gate.md  # → matches (not "ai:secrets")
```

---

## Phase 3: Minor Cleanup

### 3a. Remove `ai:local` convenience script

```json
"ai:local": "bun run ai:check && bun run typecheck"
```

- Not used by CI. It is a developer convenience.
- `ai:premerge` already bundles `ai:check` + `typecheck` + more.
- Remove from `package.json` **and** from `ai-context.manifest.json`'s `requiredPackageScripts`.

**Files touched:**
- Root `package.json`
- `scripts/ai-context.manifest.json`

### 3b. Fix `test:unit` inconsistency — align runner

**Problem:** `apps/web` defines:
- `"test": "vitest run"` (Vitest)
- `"test:unit": "bun test src/test/validators"` (Bun test runner)

Two test runners for one project is inconsistent and increases CI surface (both must work).

**Options:**
- **A (recommended):** Drop the separate `test:unit` script entirely. Move the `validators` test pattern into `vitest` by extending the `test` command: `"vitest run"` already discovers all `*.test.ts` files. The `validators` tests are already picked up by `vitest` (they use `vitest`-compatible syntax). Run `bun --cwd apps/web test` to verify coverage includes the validators tests.
- **B:** Keep both but switch `test:unit` to `vitest run src/test/validators` for consistency.

Default: **A** — simplicity wins. One test runner, one command.

Impact on turbo pipeline: `turbo.json` defines a `test:unit` task separately from `test`. After removing the script from all packages that define it, also remove the `test:unit` task from `turbo.json`.

**Files touched:**
- `apps/web/package.json` (remove `test:unit` entry)
- Root `package.json` (remove `"test:unit": "turbo test:unit"`)
- `turbo.json` (remove `test:unit` task)
- `scripts/ai-context.manifest.json` (keep — `test:unit` is NOT in `requiredPackageScripts`)

### 3c. Update `ai-context.manifest.json` after script removals

After Phase 2 + Phase 3, update the manifest's `requiredPackageScripts` array:
- Remove `ai:local` (3a)
- Keep `ai:check`, `ai:eval`, `ai:premerge`, `lint`, `typecheck`, `test`, `build`

**Files touched:**
- `scripts/ai-context.manifest.json`

### Phase 3 Acceptance

```bash
bun --cwd apps/web test  # → validates vitest + validators tests all pass
bun --cwd apps/web typecheck  # → no regression
bun run ai:check  # → manifest lists are consistent with package.json
```

---

## Phase 4: Trim Over-Engineered Script Files

**Why last**: File-level refactoring carries the highest risk of subtle breakage. The previous phases reduce the surface area (fewer scripts = fewer entry points into these files). This phase focuses on removing low-impact checks that inflate file size without meaningful CI value.

### 4a. Trim `check-ai-context.mjs` (624 → ~480 lines)

Remove these checks (they validate AI-tooling meta-quality, not app correctness):

| Check to remove | Lines | Why |
|----------------|-------|-----|
| `checkEntrypointSizes` | 122–129 | Warns if `AGENTS.md` > 6500 bytes. Soft warning, never blocks CI. Meta-doc concern. |
| `checkThinWrappers` | 149–166 | Validates that CLAUDE.md/GEMINI.md/CODEX.md/copilot-instructions.md are < 1500 bytes and route to AGENTS.md. Only meaningful if AI tooling changes wrappers. |
| `checkSkillDescriptionTriggers` | 414–439 | Warns if skill descriptions lack "Use when" phrasing. Only relevant when authoring skills — not per-commit. |
| `checkSkillChecklistVerifiable` | 441–466 | Checks if skills have verifiable checklists. Meta-pattern for skill authors. |
| `checkGoldenExamplePaths` | 489–509 | Validates file paths in `golden-examples.md` exist. Rarely changes. |

Keep the following — they have real CI value:
- `checkRequiredFiles` — validates critical context files exist.
- `checkAiDocSizes` — warns if AI doc files exceed 5000 bytes (soft).
- `checkSizeBudgets` — hard error if key files exceed size budgets.
- `checkMarkdownLinks` + `checkDocPathReferences` — link-rot detection (added real value in CI).
- `checkFrontmatter` — validates doc structure.
- `checkContextIndexCoverage` + `checkWorkflowIndexNames` — validates `docs/ai/index.md` is accurate.
- `checkPackageScripts` — validates manifest-listed scripts exist in `package.json`.
- `checkDesignTokenBoundaries` + `checkUiPackageBoundaries` — code quality enforcement.
- `checkSecretsIntegration`, `checkSkillShimsSync`, `checkProjectGraphSync` — delegated sub-script invocations that catch drift.
- `checkRuleInventory` — validates review-gate.md points at the rule registry.
- `checkStructuredMarkdown` — validates SKILL.md frontmatter + sections.

**Files touched:**
- `scripts/check-ai-context.mjs` (remove 5 check functions + their call sites)

### 4b. Trim `check-review-gate-rules.mjs` (985 → ~800 lines)

**Consideration:** This file is a mini-static-analyzer with 16 rules. Several rules overlap with existing tooling:

| Rule | Could ESLint/TS cover it? | Decision |
|------|--------------------------|----------|
| `supabase-select-star` | ✅ ESLint custom rule | Keep for now (no ESLint plugin exists for this) |
| `service-role-client` | ✅ ESLint  | Keep (P0 security, extra vigilance justified) |
| `swallowed-error` | ✅ ESLint `no-empty` | Keep (pattern is server-I/O specific) |
| `mutation-without-invalidation` | ❌ No ESLint equivalent | Keep |
| `missing-loading-state` | ❌ No ESLint equivalent | Keep |
| `cache-life-too-short` | ❌ Too specific | Keep |
| `cache-tag-unparameterized` | ❌ Too specific | Keep |

**Conclusion:** None of the 16 rules can be cleanly replaced by existing ESLint plugins. Each is specific to the project's stack (Supabase, TanStack Query, Next.js 16 cache). Keep the file as-is.

However, the **self-test fixture** (lines 840–955) is large (~115 lines) and only runs with `--self-test`. Move the fixture inline data into a separate `scripts/__fixtures__/` directory or keep it — for now, keep it as-is since splitting adds complexity without measurable benefit.

**Files touched:** None for 4b.

### Phase 4 Acceptance

```bash
# Verify removed checks no longer run
bun run ai:check  # → passes with fewer WARNs (previously had 2-4 from skill descriptions etc.)
bun run ai:eval   # → still passes (review-gate self-test + static analysis + secrets)
bun --cwd apps/web test  # → all tests pass
```

---

## Final Validation

Run in order. Each must pass before moving on.

```bash
# 1. Targeted: AI context validation
bun run ai:check

# 2. Targeted: AI regression evals
bun run ai:eval

# 3. Full app test suite
bun --cwd apps/web test

# 4. App typecheck + lint
bun --cwd apps/web typecheck
bun --cwd apps/web lint

# 5. Monorepo typecheck + lint
bun run typecheck
bun run lint

# 6. Build
bun run build

# 7. CI gate: the two workflows that actually run
rg "bun run (ai:check|ai:eval|test|typecheck|lint)" .github/workflows/ci.yml
rg "bun run (ai:check|ai:eval)" .github/workflows/docs-health.yml
# Both should reference only scripts that still exist in package.json.
```

Expected outcomes:
- `ai:check` passes (fewer WARN messages than baseline due to removed meta-checks).
- `ai:eval` passes (review-gate self-test + secrets scan identical to baseline).
- `test` passes — the validators tests are still covered.
- `typecheck` + `lint` pass — no imports broken.
- `build` succeeds — no monorepo pipeline breaks.

## Out of Scope (Explicitly)

- **Renaming script files** — `scripts/clean.mjs`, `scripts/sync-skills.mjs`, etc. keep their names. Renames risk git-blame disruption for no functional gain.
- **Converting `scripts/*.mjs` to TypeScript** — these are Bun scripts. `.mjs` is correct for `node --experimental-modules` interop. No benefit.
- **Adding new scripts** — this plan is subtractive only. New scripts are a separate decision.
- **Touching `packages/ui/scripts/generate-exports.ts`** — it is well-scoped (85 lines), has clear CI value, and is not over-engineered.
- **Changing ESLint / TypeScript config** — not in scope.
- **Supabase, auth, env, or any server-only module** — not in scope.
