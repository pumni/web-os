# Plan: Context Layer — Review Fixes (2026-07-10)

- **Status:** Shipped
- **Date:** 2026-07-10
- **Owner:** AI context layer (`docs/ai/index.md`)
- **Basis:** Deep review 2026-07-10 vs Agent Context Layer research; follows
  `docs/plans/context-layer-gap-fill-2026-07.md` (shipped 2026-07-09).
- **Skill:** `refactor-plan` (structure/config/prose only — no observable product
  behavior changes).
- **User decisions (2026-07-10):** postgres MCP → **delete** (option a);
  commit policy → **single final commit on a dedicated branch** (explicit opt-in).

## Goal

Close the residual defects found in the 2026-07-10 review:

| ID | Finding | Severity |
| --- | --- | --- |
| R1 | postgres MCP: npm-deprecated package **and** DSN passed via env var the server never reads (README: positional arg only) — server never worked; supply-chain liability | P1 |
| R2 | `.claude/rules/*` globs not honored by current harness — both files (~3.9KB) injected always-on at session start (measured 2026-07-10); three docs claim "auto by glob"; no size budget covers them | P1 |
| R3 | Drift notice `testing` (HEAD~1): disposition needed before the signal ages out | P2 |
| R4 | `scripts/run-ai-evals.mjs` header claims behavioral tier "removed" while `ai:eval:behavioral` exists (dry-run recorded 2026-07-10) | P2 |
| R5 | `docs/ai/agent-command-policy.md` at 5297B fires the hard-coded 5000B WARN on every `ai:check`; ~100B from its 5400B budget | P2 |

## Non-goals (hard fence)

- No new MCP servers; no replacement postgres server.
- No change to `check-context-drift.mjs` window mechanics (evidence-gated: reopen
  only after a second drift signal is demonstrably missed).
- No `npx` → `bunx` swap in `.mcp.json` (runtime-compat risk, zero measured gain).
- No removal of `globs:` frontmatter from `.claude/rules/*` (declared intent for
  glob-capable harnesses; body text carries the reality).
- No edits to `.agents/workflows/review-gate.md`, `AGENTS.md` root P0–P4 wording,
  skills, ADRs; no new scripts; no product code.
- No budget raises in `scripts/ai-context.manifest.json` (additions only).

## Context (current state)

- `.mcp.json:10-16` — postgres block passes `POSTGRESQL_CONNECTION_URI` env;
  package `@modelcontextprotocol/server-postgres@0.6.2` is npm-deprecated.
- `docs/ai/mcp.md` (3774B) — frontmatter description + §2 document postgres as a
  live server; §Rejected Candidates exists.
- `docs/ai/index.md:23` "auto-loaded by glob" + Tool Support Matrix `auto by path`.
- `apps/web/AGENTS.md:8-11` "these load automatically…".
- `.claude/rules/nextjs-async-apis.md` (1320B) / `nextjs-cache-components.md`
  (2568B) — body line 3 claims conditional loading; not in `sizeBudgets`.
- `scripts/run-ai-evals.mjs:8-11` — stale "no behavioral tier" comment.
- `docs/ai/agent-command-policy.md` — 5297B (> 5000B WARN, budget 5400B).
- Drift `testing`: HEAD~1 diff = mechanical guard re-anchor (ADR-0012 removal →
  tests point at `design-system.md`); `docs/conventions/testing.md` and
  `testing-template` skill describe process, not those guards.

## Target State

- `.mcp.json` declares next-devtools only; postgres documented as a rejected
  candidate in `mcp.md` (deprecated upstream; config never worked; fallback =
  `packages/supabase/src/types.ts` + `supabase/migrations`).
- All three loading claims say **always-loaded** for `.claude/rules/*` on the
  current harness; both rule files carry size budgets (1500B / 2900B).
- `run-ai-evals.mjs` header describes the opt-in behavioral tier truthfully.
- `agent-command-policy.md` ≤ 4990B; `ai:check` runs with **zero warnings**.
- R3 dispositioned as verified no-op (recorded below, no doc edit).

## Constraints & Invariants

- P0–P4 unchanged; DSN env name `${SUPABASE_DEV_DB_READONLY}` never replaced by a
  literal; no secrets in any diff.
- Size budgets respected: `mcp.md` ≤ 5000B, `index.md` ≤ 4400B,
  `agent-command-policy.md` ≤ 5400B (target < 5000B).
- Meaning-preserving edits only: reworded loading claims must keep the same rule
  content; policy trim removes redundancy, not rules.
- `.claude/settings.local.json` is gitignored — Step 8 is local-only, outside the
  commit.

## Pre-flight (baseline)

- [x] `bun run ai:check` — PASS, 1 warning (`agent-command-policy.md` 5297B). Recorded 2026-07-10.
- [x] `bun run ai:eval` — PASS (314 code files, 22 SQL files; secrets scan clean; feature boundaries green). Recorded 2026-07-10.
- [ ] Branch `context/review-fixes-2026-07` created from `main` before Step 1.
- Characterization tests: N/A — no code seam changes; `ai:check` + `ai:eval` are
  the behavior harness for this scope.

## Steps

### Step 1: Remove postgres server from `.mcp.json`

- **File(s):** `.mcp.json:10-16`
- **Action:** Delete the `"postgres"` entry; keep `next-devtools` byte-identical.
- **Verification:** `bun run ai:check` green; `git diff .mcp.json` shows no DSN/secret and no `next-devtools` change.
- **Rollback:** `git checkout -- .mcp.json`
- **Depends on:** none

### Step 2: Rewrite `docs/ai/mcp.md` for single-server reality

- **File(s):** `docs/ai/mcp.md` (frontmatter description, intro §1-2, §Rejected Candidates)
- **Action:** Drop postgres from description/intro/§2; keep the schema fallback ("prefer `packages/supabase/src/types.ts` + `supabase/migrations`; do not invent columns/policies") under the unavailability section; add postgres to §Rejected Candidates: npm-deprecated upstream, DSN config never worked (positional-arg-only server), fallback is sufficient. Keep pin policy section. File ≤ 5000B.
- **Verification:** `bun run ai:check` green; `(Get-Item docs/ai/mcp.md).Length -le 5000`
- **Rollback:** `git checkout -- docs/ai/mcp.md`
- **Depends on:** Step 1

### Step 3: Fix loading claims in `docs/ai/index.md`

- **File(s):** `docs/ai/index.md:23` (section header), Tool Support Matrix row `Path-scoped rules`
- **Action:** "auto-loaded by glob" → "always-loaded on Claude Code (globs are declared intent, not honored by current harness)"; matrix cell `auto by path` → `always loaded`. No other rows touched. File ≤ 4400B.
- **Verification:** `bun run ai:check` green
- **Rollback:** `git checkout -- docs/ai/index.md`
- **Depends on:** none

### Step 4: Fix loading claims in `apps/web/AGENTS.md` + both rule bodies

- **File(s):** `apps/web/AGENTS.md:8-11`; `.claude/rules/nextjs-async-apis.md:8`; `.claude/rules/nextjs-cache-components.md:10`
- **Action:** Replace "load automatically when you open…" phrasing with "always loaded on Claude Code; other harnesses load them via the globs in frontmatter". Rule content untouched.
- **Verification:** `bun run ai:check` green
- **Rollback:** `git checkout -- apps/web/AGENTS.md .claude/rules`
- **Depends on:** none

### Step 5: Budget the always-on rules

- **File(s):** `scripts/ai-context.manifest.json` (`sizeBudgets`)
- **Action:** Append `{ ".claude/rules/nextjs-async-apis.md": 1500 }` and `{ ".claude/rules/nextjs-cache-components.md": 2900 }` entries (schema-matching objects).
- **Verification:** `bun run ai:check` green (budgets active, both files under)
- **Rollback:** `git checkout -- scripts/ai-context.manifest.json`
- **Depends on:** Step 4 (sizes settle after wording edit)

### Step 6: Truthful header in `run-ai-evals.mjs`

- **File(s):** `scripts/run-ai-evals.mjs:8-11`
- **Action:** Replace "there is intentionally no LLM-in-the-loop behavioral eval tier (removed…)" with a sentence naming `ai:eval:behavioral` as the opt-in, fail-open-without-API-key tier. Comment-only diff.
- **Verification:** `bun run ai:eval` green
- **Rollback:** `git checkout -- scripts/run-ai-evals.mjs`
- **Depends on:** none

### Step 7: Trim `agent-command-policy.md` under the 5000B WARN

- **File(s):** `docs/ai/agent-command-policy.md`
- **Action:** Condense redundancy ≥ 308B without dropping any rule: shorten the PowerShell `$env:`/`$null` hazard paragraph and merge duplicated "narrowest gate" phrasing between §Minimum path and §Validation Gates. No rule deleted, only compressed.
- **Verification:** `bun run ai:check` → **zero warnings**
- **Rollback:** `git checkout -- docs/ai/agent-command-policy.md`
- **Depends on:** none

### Step 8: Local-only — clean `disabledMcpjsonServers`

- **File(s):** `.claude/settings.local.json` (gitignored, not in commit)
- **Action:** Remove `"postgres"` from `disabledMcpjsonServers`.
- **Verification:** file parses as JSON (`bun -e "JSON.parse(require('fs').readFileSync('.claude/settings.local.json','utf8'))"`)
- **Rollback:** re-add the string
- **Depends on:** Step 1

### Step 9: Closeout

- **File(s):** this plan (Status), size snapshot
- **Action:** Re-run full gates; record sizes; set Status → Shipped; single commit of Steps 1–7 + this plan.
- **Verification:** `bun run ai:check` (0 warnings) && `bun run ai:eval`
- **Rollback:** `git revert <sha>`
- **Depends on:** Steps 1–8

## R3 disposition — drift notice `testing` (verified no-op)

HEAD~1 diff over `apps/web/src/test/**` + `packages/ui/src/test/**` is a
mechanical re-anchor after ADR-0012 removal (guards moved from the deleted ADR
to `design-system.md`); five test files, no runner/config/pattern change.
`docs/conventions/testing.md` and `.agents/skills/testing-template/SKILL.md`
describe process and seams, neither documents those guards. **No doc edit
required.** If the same subsystem flags again with a real convention change,
handle it then.

## Testing Strategy

No code seams change. The deterministic gates are the harness:
`bun run ai:check` after every doc/config step (narrowest gate for context
scope), `bun run ai:eval` after Step 6 and at closeout. No new tests.

## Definition of Done

1. Steps 1–7 shipped; Step 8 applied locally; R3 recorded as no-op.
2. `bun run ai:check` passes with **zero warnings**; `bun run ai:eval` passes.
3. No file outside declared scope touched; no budget raised.
4. Single commit on `context/review-fixes-2026-07`; Status → Shipped.

## Risks & Edge Cases

| Risk | Mitigation |
| --- | --- |
| `mcp.md` frontmatter description drives skill-style routing — over-trimming hides the doc | Keep description verb-led with next-devtools triggers; only postgres clauses removed |
| Policy trim accidentally weakens a rule | Diff review line-by-line: compression only, every rule keyword survives |
| Budget entries typo'd → gate ignores them silently | After Step 5, temporarily append a char over budget locally to confirm the gate fires, then revert |
| Harness later honors globs (rules become conditional) | Wording says "current harness"; budgets stay valid either way |
