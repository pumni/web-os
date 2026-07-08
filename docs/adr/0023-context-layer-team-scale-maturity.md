# 0023. Context Layer — Team-Scale Maturity

- **Status:** Deprecated (Known Failure Modes sections, context-drift detector, Tier-2 exemplar subagents all live; rejection rationale for full agent fleet and vector memory preserved in `docs/adr/README.md` historical note)
- **Date:** 2026-07-01
- **Owner:** AI context layer (see `docs/ai/index.md`)

## Context

ADR-0009/0013 froze the context layer after proving a "meta-inversion" (guidance
outweighed real rules) and cutting it to a lean, deterministically-enforced set.
That work optimized for **token minimalism**. Two independent 2026 research
syntheses (archived under `docs/plans/context-layer-maturity-2026-07.md` §0)
converge on capability the lean layer omits, and the layer must now follow best
modern standard for team + multi-package scaling rather than single-author lean:

1. On-demand retrieval under-serves complex, error-prone domains; the strongest
   empirical lever is pre-loaded, distilled "symptom → cause → fix" domain
   knowledge co-located with the procedure that uses it.
2. Specification staleness is the top documented failure mode; the layer catches
   doc→code drift only at gate time via explicit anchors, with no session-start
   signal.
3. A single-agent skill layer has no isolation seam for future domain-expert
   review at team scale.

This is a measured trigger under the ADR-0009/0013 freeze, not prose tuning.

## Decision

Extend the lean layer with four additive capabilities, keeping every existing
deterministic gate: (1) an optional, recommended `## Known Failure Modes` section
convention for error-prone skills, surfaced as a non-blocking WARN by the skill
validator; (2) a tool-agnostic context-drift detector (`scripts/check-context-drift.mjs`
+ `scripts/context-map.json`) with a fail-open SessionStart hook; (3) a Tier-2
isolation *seam* — one exemplar read-only domain-reviewer subagent plus a
documented extension pattern, explicitly not a full agent fleet; (4) complete
nearest-file `AGENTS.md` coverage (`apps/catalog`). Domain knowledge stays
single-sourced in skills/conventions/ADRs; new surfaces reference it.

## Consequences

Positive: error-prone domains carry distilled failure knowledge; drift is visible
at session start; team scaling extends a seam instead of rebuilding; enforcement
stays deterministic and tool-agnostic. Negative/neutral: more surface to keep in
sync (mitigated by single-sourcing + the drift detector policing itself); the
`Known Failure Modes` convention is WARN-only to avoid burdening single-use
skills. Re-freeze after this plan: no further context-layer ADR without a new
measured trigger.

## Alternatives considered

- Full Tier-2 agent fleet (the case study's 19 personas) — rejected: both reports
  warn a well-designed single agent beats multi-agent under equal compute; we add
  one exemplar + a seam instead.
- Vector/graph long-term memory (Mem0/Letta/Zep) — rejected: harness-managed
  memory + `docs/ai/MEMORY.md` suffice; context-collapse risk, upkeep cost.
- Re-add spec/PRD workflows removed by ADR-0009 — rejected: harness plan-mode +
  the grill-requirements skill already cover the feature lifecycle.
- MCP doc-retrieval server for cold memory — rejected: grep/LSP/code-graph
  navigation is the 2026 standard and the repo already has `project-graph`.
- Do nothing (keep the freeze) — rejected: the measured trigger above.
