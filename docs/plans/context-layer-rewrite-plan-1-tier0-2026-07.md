# Plan 1 — Tier 0: Always-Loaded Behavior Layer + Router Collapse

**Depends on:** — (first plan). Master: `context-layer-rewrite-master-2026-07.md`.
**Goal:** The behavior tier loads correctly on every harness, the root becomes
the single navigation map, and the three donor docs (`index`,
`agent-command-policy`, `agent-behavior`) plus `quality-gates.md` and
`llms.txt` dissolve into it. Fixes: F1, F4, F6, F7, F8, F10 (partial), F14
(mechanical half), F17 (budget reset for root).

**Non-goals (hard fence):** `.claude/rules/*` content and `paths:` migration
(Plan 2); skill body semantics (Plan 3); `design-system.md` (Plan 5); gate
script redesign (Plan 6). Do not touch `supabase/`, feature code, or tests.

**Gate:** `bun run ai:check` per step; `bun run ai:premerge` to close.

## Pre-flight

- [ ] `bun run ai:premerge` green — record as baseline.
- [ ] Working branch confirmed (already on `refactor/context-layer-runtime-doctrine`).
- [ ] Commit or stash unrelated working-tree noise (`scripts/ai-metrics.json`
      regen — commit it first as its own `chore` commit).
- [ ] Write **ADR-0027 "Context Layer v2 — standards alignment"**: Context (F1
      evidence + audit link), Decision (master-plan decision ledger by
      reference), Consequences, Alternatives (include: keep llms.txt — rejected,
      supersedes ADR-0022's keep-decision). Run `bun run ai:adr:sync`.

## Steps

1. **Fix the broken import (F1).** `CLAUDE.md` → single line `@AGENTS.md`.
   Verify: `bun run ai:check` green; manual smoke — new Claude Code session
   shows `<SECURITY_MANDATES>` in loaded project instructions.
   Rollback: restore previous file.

2. **Derive the commit-scope list (Q9).** `git log --format=%s -200` → extract
   `type(scope)` pairs actually used; keep the ~8 most frequent scopes for the
   root PR/commit section. No file edits; feeds step 3.

3. **Rewrite `AGENTS.md` root** to the audit §8 skeleton (13 sections, ≤150
   lines). Content contract:
   - ADD: source-of-truth declaration (Sentry line, names `.claude/*` as
     generated/pointers); navigation table (hand-written this plan; rows per
     §8-6 incl. "Required skill" column per Q6); core commands + 5-line gate
     ladder (distilled from `agent-command-policy.md` Validation Gates +
     `quality-gates.md`); Always/Ask-first/Never (Never = pointer to P0, plus
     "never delegate security-sensitive reads to a subagent", "never
     npm/pnpm/yarn — preinstall enforces bun"); working contract additions
     (exception-stop, critical-peer push-back); PR & commit section (step 2
     scopes); glossary pointer; one-line PowerShell-7 note.
   - KEEP verbatim: `<SECURITY_MANDATES>`, Untrusted Content Policy (+ one
     honor-system sentence salvaged from `agent-behavior.md`), Priority Stack
     (compressed), DoD (3 criteria).
   - REMOVE (rehomed): training-data warning + React Compiler rule (→ step 4),
     full state-ownership paragraph (→ one bullet + pointer), Read Routing,
     standalone Mandatory Skill table, P0 restatement inside Boundaries.
   - Manifest: set `sizeBudgets` for `AGENTS.md` = new byte size × 1.2.
   Verify: `bun run ai:check`; line count ≤150.
   Rollback: git revert of the step commit.

4. **`apps/web/AGENTS.md` receives its two orphans**: the "not the Next.js in
   your training data" warning (dedup with its own existing phrasing) and the
   React Compiler rule (no new `useMemo`/`useCallback`; exceptions list).
   Leave the "Hard rules (SSOT)" section pointing at `.claude/rules/*` for now
   — Plan 2 flips it. Verify: `bun run ai:check`.

5. **Nested AGENTS.md pass (9 packages/apps):**
   - Standardize the preamble to one line ("Package delta; root AGENTS.md
     applies.") across all files.
   - Compress P0 service-role restatements in `env`/`auth`/`supabase` to one
     line + pointer to `docs/conventions/supabase-security.md`.
   - Shrink `packages/test-utils/AGENTS.md` to ~15 lines.
   - **Delete `packages/features/` entirely (Q7)** — zero deps/dependents.
     Remove from any tsconfig references; run `bun run ai:graph:sync`;
     `bun run typecheck` must stay green.
   Verify: `bun run ai:check && bun run typecheck`.

6. **Nested CLAUDE.md shims (Q10, F8).** Extend `scripts/sync-skills.mjs` (or
   add `scripts/sync-claude-shims.mjs` wired as `ai:shims:sync`) to emit
   `CLAUDE.md` containing exactly `@AGENTS.md` next to every `AGENTS.md`
   below root. Generate the 9 shims. Add them to `.claude`-shim staleness
   checking later (Plan 6); for now the sync script is the source.
   Verify: script idempotent (second run = no diff); `bun run ai:check`.

7. **Delete `llms.txt` (Q2).** Sweep inbound refs (`rg -l 'llms\.txt'`):
   manifest `requiredFiles`, `docs/ai/index.md` (dies in step 8), MEMORY.md
   entry, ADR-0022 (mark **Superseded by ADR-0027**), Stop-hook regex may keep
   the pattern (harmless). Verify: `bun run ai:check`.

8. **Dissolve the donor docs.** Delete `docs/ai/index.md`,
   `docs/ai/agent-command-policy.md`, `docs/ai/agent-behavior.md`,
   `docs/quality-gates.md`. Salvage map (already folded into root in step 3):
   gate ladder, PowerShell note, bun-only rule, honor-system sentence,
   no-security-delegation line. Everything else (generic Tool Discipline,
   runtime-context doctrine, Tool Support Matrix) is deleted deliberately.
   - Reference sweep (`rg -l` each path): 4 skills' "Read docs/ai/index.md"
     lines → "the root `AGENTS.md` navigation table" (mechanical swap only —
     semantic pass is Plan 3); `copilot-instructions.md` gate line → root gate
     section; `review-gate.md`, `exec-plan.md`, `mcp.md`, `MEMORY.md`,
     `golden-examples.md`, `.claude/agents/*` as found.
   - Manifest: remove the four files from `requiredFiles`,
     `frontmatterRequired`, `sizeBudgets`; drop/neutralize
     `indexRequiredReferences` (if `check-ai-context.mjs` requires the key,
     make the consumer tolerate its absence — minimal script touch, note it
     for Plan 6).
   - Run `bun run ai:skills:sync` (descriptions unchanged but shims re-checked).
   Verify: `bun run ai:check && bun run ai:eval`.

9. **Close.** Delete stray root file `nguồn repo.md` (content already distilled
   into the research doc). `bun run ai:metrics` regen; `bun run ai:premerge`.
   Amend ADR-0027 changelog with step-8 deletions.

## Definition of done

- [ ] Fresh Claude session loads root content (P0 visible) — manual smoke.
- [ ] Root ≤150 lines, within its new manifest budget.
- [ ] `docs/ai/` = 5 files (`common-mistakes`, `domain-language`,
      `golden-examples`, `mcp`, `MEMORY`); `llms.txt`, `quality-gates.md`,
      `nguồn repo.md`, `packages/features/` gone.
- [ ] 9 nested `CLAUDE.md` shims exist and are regenerable.
- [ ] `rg 'docs/ai/index\.md|agent-command-policy|agent-behavior|quality-gates\.md|llms\.txt'`
      returns only research/audit/plan/archive docs.
- [ ] `bun run ai:premerge` green.

## Risks

| Risk | Severity | Mitigation |
|---|---|---|
| Missed inbound reference to a deleted doc | M | `rg` sweep per step + `checkDocPathReferences` in `ai:check` fails on broken backtick refs |
| `check-ai-context.mjs` hard-requires a removed manifest key | M | Step-8 minimal consumer guard; full redesign deferred to Plan 6 |
| Root rewrite drops a load-bearing rule | H | Content contract in step 3 lists KEEP/REMOVE explicitly; audit §5.1 is the checklist; review diff against it before commit |
| Deleting `packages/features` breaks an unseen import | L | Graph shows zero edges; `typecheck` + `build` in premerge confirm |
