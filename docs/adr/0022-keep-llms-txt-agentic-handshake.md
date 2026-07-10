# 0022. Keep llms.txt as the Agentic Handshake Map

- **Status:** Superseded by [ADR-0027](0027-context-layer-v2-standards-alignment.md)
- **Date:** 2026-07-01
- **Owner:** AI context layer (see `docs/ai/index.md`)
- **Supersedes:** ADR-0013 §4 (the `llms.txt` removal half only)

## Context

ADR-0013 §4 (2026-06-24) removed `llms.txt` as redundant with `docs/ai/index.md`
in a private monorepo. It was since restored as the tool-agnostic "agentic
handshake" entry map, re-added to `scripts/ai-context.manifest.json`
`requiredFiles`, and referenced from `docs/ai/index.md`. The ADR layer (P3) thus
contradicted the enforced manifest (P1). Per `docs/adr/README.md`, when a decision
and an enforced config disagree, enforce the config and update the ADR.

## Decision

Keep `llms.txt` as a required context file: a short human+agent map of the
tool-agnostic context (start-here → conventions → reference → skills). It stays in
`requiredFiles`, is referenced from `docs/ai/index.md`, and is link-checked by
`scripts/check-ai-context.mjs`. The remaining ADR-0013 decisions (freshness
removal, `when-to-load` collapse, generated skill shims, `CODEX.md`
normalization) stand.

## Consequences

Positive: P1 (manifest) and P3 (ADR) agree; new agents/tools get one stable
handshake file. Negative/neutral: `llms.txt` must stay in sync with
`docs/ai/index.md` (recorded in `docs/ai/MEMORY.md`); it is small and gate-checked,
so drift fails `bun run ai:check`.

## Alternatives considered

- Re-delete `llms.txt` to honor ADR-0013 §4 — rejected: it is a `requiredFiles`
  entry; deletion fails `checkRequiredFiles`, and the handshake map earns its keep.
- Leave the contradiction as an inline note on ADR-0013 — rejected: a load-bearing
  reversal deserves its own record (README lifecycle: supersede via a new ADR that
  references the old one).
