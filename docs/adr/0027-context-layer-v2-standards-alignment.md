# 0027. Context Layer v2 — Standards Alignment

- **Status:** Accepted
- **Date:** 2026-07-11
- **Owner:** AI context layer

## Context

An independent standards research pass
(`docs/research/agent-context-layer-architecture-2026-07.md`) and a full-tree
audit (`docs/research/context-layer-audit-2026-07.md`, findings F1–F17)
measured the context layer against the 07/2026 open-standard stack
(AGENTS.md / Agent Skills / MCP / llms.txt + operational best practice).

The freeze policy in `docs/adr/README.md` required measured regression
evidence before another context-layer change. That evidence exists and is
severe: **F1 — `CLAUDE.md` contained the literal text `AGENTS.md` without the
`@` import sigil, so Claude Code loaded none of the root behavior tier (P0
security mandates included), and no gate detected it.** Supporting findings:
canonical Next.js rules living in a tool-specific directory (F2), ~930
permanent tokens of always-loaded rules that the standard says should be
path-scoped (F3), three overlapping navigation maps (F4), duplicated
invariants across up to 10 homes (audit §6), and corrupted text in two
context files that no gate caught (F5, F12).

## Decision

Execute the six sequential per-tier plans in
`docs/plans/context-layer-rewrite-*.md`. The decision ledger (13 resolved
decision points) lives in `context-layer-rewrite-master-2026-07.md`; the
headline decisions:

1. Root `AGENTS.md` is rewritten to the standards template: source-of-truth
   declaration, navigation map (with required-skill column), core commands +
   gate ladder inline, Always/Ask-first/Never boundaries, working contract,
   PR/commit conventions. `CLAUDE.md` becomes a real `@AGENTS.md` import;
   nested `CLAUDE.md` shims are generated so "closest wins" works on Claude
   Code.
2. `docs/ai/index.md`, `docs/ai/agent-command-policy.md`,
   `docs/ai/agent-behavior.md`, `docs/quality-gates.md`, and `llms.txt` are
   dissolved into the root (this ADR **supersedes ADR-0022**: the repo
   publishes no docs site, so `llms.txt` is outside its spec'd use; root
   AGENTS.md is the single entry map).
3. Canonical Next.js 16 content moves to `docs/conventions/nextjs-16.md`;
   `.claude/rules/*` become thin `paths:`-scoped pointers (amends ADR-0003's
   description of the rules layer).
4. `.agents/workflows/` retires; review-gate and the human half of
   skill-health-check become skills.
5. The meta machinery is right-sized and gains the checks that would have
   caught F1/F5/F12 (`checkClaudeShims`, encoding hygiene), plus a
   single-source navigation sync from `scripts/context-map.json`.

## Consequences

- Positive: the behavior tier actually loads on Claude Code; permanent
  per-session load targets ≤ ~2.5k tokens with per-file budgets at ~20%
  headroom; each invariant has exactly one canonical home; navigation is one
  hop from root; the F1 failure class becomes gate-detectable.
- Negative: one-time churn across ~40 context files and every inbound
  reference; tools that consumed `llms.txt` must start from `AGENTS.md`.
- Neutral: ADR register numbering unaffected; product ADRs (0010, 0011,
  0021, 0025) untouched.
- Evidence log (amended as plans close):
  - Plan 1: behavior tier loads on Claude Code; `CLAUDE.md` → `@AGENTS.md`; F1 closed.
  - Plan 2: `docs/conventions/nextjs-16.md` created as single canonical; both Next.js
    rules shrunk to `paths:`-scoped pointers; `supabase-migrations` rule added (Q8);
    cache-semantics duplication collapsed; ADR-0003 amended (F15).
  - Plan 3: workflows tier retired; review-gate and skill-health-check converted to skills (19 skills total); exec-plan deleted and decision-log salvaged.


## Alternatives considered

- **Keep llms.txt as a generated artifact** — rejected: it is a third map to
  keep in sync for a repo with no published docs site; AGENTS.md is already
  the cross-tool standard entry (supersedes the keep-decision of ADR-0022).
- **Adopt `getsentry/dotagents` (`agents.toml`)** — rejected for now: the
  existing sync scripts already implement "tool config is generated, never
  authored"; revisit when a third agent tool joins the team.
- **Keep the always-loaded Next.js rules** (status quo) — rejected: ~930
  tokens per session for rules irrelevant to most sessions inverts the
  pre-fetch/just-in-time economics; `paths:` scoping delivers the same rules
  exactly when the files are touched.
- **One giant plan instead of six sequential per-tier plans** — rejected:
  per-tier plans keep every intermediate state green and reviewable
  (plan-over-code review leverage).
