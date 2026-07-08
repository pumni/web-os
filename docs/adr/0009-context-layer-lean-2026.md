# 0009. Context Layer — Lean 2026

- **Status:** Deprecated (all 7 decisions live in repo state: single `docs/ai/index.md` router, `docs/ai/*` with description frontmatter, `.claude/rules/` deduplication, validation altitude, hybrid skill shims, `review-gate.md` only workflow)
- **Date:** 2026-06-20
- **Owner:** AI context layer (see `docs/ai/index.md`)
- **Refined by:** ADR-0013 (2026-06-24) — removed the per-doc freshness check,
  merged `when-to-load` into `description`, and made the `.claude` skill shims
  generated rather than hand-synced. (§4 `llms.txt` removal in ADR-0013 was
  subsequently reversed by **ADR-0022**). The lean direction below stands.

## Context

ADRs 0005, 0006, and 0007 (all dated 2026-06-19) each claimed to fix the
context layer's "meta-inversion", yet a 2026-06-20 measurement still showed
`docs/ai/*` (how to use context) at ~52 KB / 19 files versus `docs/conventions/*`
(the actual engineering rules) at ~12.5 KB / 7 files — the meta layer was ~4×
the real rules and had grown since those ADRs.

Root cause: the layer re-implemented in prose what a modern agent harness already
does natively. A hand-rolled router cascade (`index.md` → `flow-router.md` →
`context-map.md` → `task-routes/*`), an operating manual
(`agent-behavior.md`: PLAN/RETRIEVE/EXECUTE, risk levels R0/R1/R2, an "~8 files"
subagent threshold), and meta-meta tooling (`ai-metrics.mjs` measuring whether
docs "earn" their tokens; an LLM-in-the-loop behavioral prompt-injection eval
needing `LLM_API_KEY`) all duplicated harness-native routing, planning,
delegation, and summarization. Next.js 16 rules were duplicated between
`.claude/rules/*` (glob auto-load) and `apps/web/AGENTS.md`. Validation altitude
was wrong: feature work was told to run `ai:eval`. There was also a numbering
collision (two `0007` ADRs).

The standard targeted is mid-2026 convergence: thin always-on root, nearest-file
package `AGENTS.md`, glob-auto rules, progressive-disclosure skills, and
enforcement by deterministic scripts rather than prose (cf. the agents.md
nested-file model and Agent Skills). The project chose to stay **tool-agnostic**
(`.agents/` + `AGENTS.md`) rather than bind to a Claude-Code-specific
`.claude/skills/` discovery path.

## Decision

Perform a lean refactor:

1. **Collapse the router to one file.** Delete `flow-router.md`,
   `context-map.md`, `agent-behavior.md`, `subagent-delegation.md`,
   `skill-authoring.md`, and `task-routes/*`. `docs/ai/index.md` becomes the
   single "need → canonical doc" router; `AGENTS.md` is slimmed to security +
   priority stack + project + command discipline + validation altitude.
2. **Cut harness-duplicating workflows.** Keep only
   `.agents/workflows/review-gate.md`; remove the issue/triage and
   PRD/handoff/prototype/brief workflows and the `.agents/issues` + `docs/agents`
   trackers.
3. **Cut the behavioral-eval, meta-metric, and freshness machinery.** Remove
   `run-behavioral-evals.mjs`, `eval-agent.mjs`, `eval-stub-agent.mjs`,
   `ai-metrics.mjs`, `.agents/evals/*`, and the `ai:eval:behavioral*` /
   `ai:metrics` scripts. Also remove the framework-freshness gate
   (`check-framework-freshness.mjs`, `docs/ai/framework-freshness.md`,
   `ai:freshness`): a hand-maintained "verified ≤180d" version table is upkeep
   cost; stack-version accuracy is instead deferred to the `.claude/rules/*`
   Next.js guidance and reading `node_modules/next/dist/docs/` at edit time.
   Prompt-injection resistance stays governed by the Untrusted Content Policy
   plus the deterministic secrets/RLS static scan.
4. **Dedupe Next.js 16.** `.claude/rules/*` is the single source of truth;
   `apps/web/AGENTS.md` is thinned to a nearest-file pointer.
5. **Fix validation altitude.** Code changes → `lint`/`typecheck`/`test`
   (+`build`); context-layer changes → `ai:check`/`ai:eval`.
6. **Fix governance.** Renumber the duplicate `0007-refined-command-policy.md`
   to `0008`; record this decision here.
7. **Hybrid skill discovery.** Keep canonical skill bodies in `.agents/skills`
   (tool-agnostic) but add thin `.claude/skills/<name>/SKILL.md` shims
   (`name` + `description` + a pointer) so the Claude Code harness auto-surfaces
   each skill by description (progressive disclosure) without duplicating
   content or losing portability to other tools.

The enforcement plane is preserved: `check-ai-context`, `check-secrets`,
`check-review-gate-rules` (16 static rules), and `sync-project-graph` remain the
authoritative gates.

## Consequences

Positive:

- `docs/ai/*` drops from 19 to 9 files; `.agents/workflows` from 10 to 1; the
  always-on/per-task token surface shrinks sharply and routing returns to the
  harness.
- One owner per concern; no more meta-about-meta files or router cascade.
- Validation no longer loads AI evals into pure code sessions.

Costs:

- The issue/triage and PRD/handoff workflows are gone; restore from git history
  if a real need returns.
- The LLM-in-the-loop prompt-injection eval tier is gone (it required an API key
  and rarely ran); coverage now rests on instruction-layer policy + static scans.
- `check-ai-context.mjs` no longer link-rot-checks `docs/adr/` (treated as
  append-only history, like `docs/plans/`).

## Superseded predecessors (archaeology)

ADRs 0005 (context-layer-2026-overhaul), 0006 (context-efficacy-overhaul), and
0007 (context-efficiency-2026) — all 2026-06-19 — were squashed into this
record on 2026-06-22; their meta-process narrative is captured in the Context
section above. Full text is in git history.

## Alternatives considered

- **Pure native `.claude/skills/` skills (full Matt-Pocock model, content in
  `.claude/`).** Rejected in favor of the hybrid above: thin `.claude/skills`
  shims give native auto-discovery while the canonical bodies stay in
  `.agents/skills`, preserving portability to Codex/Gemini/Copilot.
- **No native discovery at all (pure `.agents/skills`).** Rejected: it forced a
  hand-rolled router and denied the harness's description-based progressive
  disclosure.
- **Keep the behavioral eval harness, just simplify it.** Rejected as overhead
  disproportionate to a solo project; the deterministic gates carry the security
  weight.
- **Status quo / another in-place trim.** Rejected: three same-day ADRs already
  tried that and the meta layer kept growing.
