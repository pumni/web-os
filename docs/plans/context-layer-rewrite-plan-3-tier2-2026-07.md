# Plan 3 — Tier 2: Skills & Workflows Consolidation

**Depends on:** Plan 2. Master: `context-layer-rewrite-master-2026-07.md`.
**Goal:** One procedure tier — everything under `.agents/skills/` per the
agentskills spec; `.agents/workflows/` retired. Content corruption and stale
references fixed. Fixes: F5, F12, F13, F14 (semantic half); Q6/Q11 executed.

**Non-goals:** authoring new domain skills; changing skill *behavior* beyond
the listed repairs; gate internals (Plan 6).

**Gate:** `bun run ai:check && bun run ai:eval` per step; `ai:premerge` close.

## Pre-flight

- [ ] Plan 2 DoD confirmed; `bun run ai:premerge` green.

## Steps

1. **`review-gate` workflow → skill.** Create
   `.agents/skills/review-gate/SKILL.md` per the authoring standard
   (frontmatter `name`+`description` with trigger clause "Use before reporting
   done on any diff beyond pure copy/docs…", `## Rules`, `## Checklist`,
   `evals/evals.json` with 2 cases). Body = current workflow content minus
   pre-flight-for-refactors section (owned by `refactor-plan` — replace with
   pointer). Delete `.agents/workflows/review-gate.md`.
   Sweep refs (`rg -l 'review-gate'`): skills README subagent-pattern section,
   `.claude/agents/*` dispatch notes, `common-mistakes.md` header, manifest
   (`requiredFiles` + `sizeBudgets` path swap). Run `bun run ai:skills:sync`.
   Verify: gates + shim generated.

2. **Delete `exec-plan.md` (Q11).** Salvage the Decision-Log table template
   into `.agents/skills/refactor-plan/scripts/plan-templates.md` (new
   "Decision Log" shape). Sweep refs: none should remain post-Plan-1
   (`agent-behavior` gone) — confirm with `rg 'exec-plan'`.
   Verify: gates.

3. **`skill-health-check` workflow → maintenance skill.** Create
   `.agents/skills/context-health/SKILL.md`: keep step 4 (description
   freshness review) + step 5 (quarterly upstream-standards checkpoint,
   record date in `MEMORY.md`); drop steps 1–3 (machine work — absorbed into
   `ai:check` in Plan 6; note the dependency in the skill body as "run
   `bun run ai:check` first"). Delete the workflow file and now-empty
   `.agents/workflows/`. Update Stop-hook CONTEXT regex `^\.agents/` still
   covers skills (no change needed — verify only).
   Verify: gates + shim.

4. **Repair corrupted text (F5 remnant, F12).**
   `diagnosing-bugs/SKILL.md`: rewrite the garbled line ("Fry … 仅 …") to
   "Use `repro-loop.template.sh` only as a cross-platform `bun run` fallback
   on non-Windows hosts." Sweep the whole context tree for mojibake:
   `rg -n '[�]|[一-鿿]' AGENTS.md apps packages docs .agents .claude`
   — fix every hit (expected: none besides the two known).
   Verify: rg returns clean; gates.

5. **Reference surface: numbers → rule ids (F13).**
   - `codebase-design/SKILL.md`: "#11" → "the premature-abstraction pair in
     `docs/ai/common-mistakes.md` (honor-system)".
   - `common-mistakes.md`: drop the "13. merged into 10" tombstone from Plan 2;
     entries keyed by rule id in the heading (already mostly true); sweep
     `rg '#1[0-9]' docs .agents` for any remaining ordinal references.
   Verify: gates.

6. **Semantic pass on the four router-dependent skills (F14).**
   `grill-requirements`, `refactor-plan`, `diagnosing-bugs`, `domain-modeling`:
   the Plan-1 mechanical swap left "read the root navigation table" — verify
   each Pre-process/Rules step still makes sense against the new root (gate
   ladder location, glossary pointer, no dead `agent-command-policy`
   mentions: `rg 'agent-command-policy|docs/ai/index'` must be clean in
   `.agents/`). Compress the duplicated opening sentence in
   `watch-sync/SKILL.md` intro (audit §9.5). Run `bun run ai:skills:sync`.
   Verify: gates.

7. **Close.** `bun run ai:premerge`; amend ADR-0027 changelog (workflows tier
   retired; skill count now 19: 17 + review-gate + context-health).

## Definition of done

- [ ] `.agents/workflows/` no longer exists; 19 skills each pass the
      authoring-standard gate; shims in sync.
- [ ] Mojibake sweep clean across the context tree.
- [ ] No ordinal (`#N`) cross-references to common-mistakes remain.
- [ ] `rg 'docs/ai/index|agent-command-policy|exec-plan'` clean outside
      research/audit/plans/archive.
- [ ] `bun run ai:premerge` green.

## Risks

| Risk | Severity | Mitigation |
|---|---|---|
| review-gate loses its "always applies" force as an opt-in skill | M | Root Always list (Plan 1) carries "self-review before done → review-gate skill"; description front-loads triggers |
| CJK regex flags legitimate content | L | Manual review of each hit before editing |
| Skill count drift breaks a metrics assertion | L | `ai:metrics` regenerated at close; thresholds adjusted in Plan 6 |
