# 0027. Context Layer v2 — Standards Alignment

- **Status:** Accepted
- **Date:** 2026-07-11
- **Owner:** Engineering Team

## Context

The repository had accumulated tool-specific rules, duplicated navigation,
large always-loaded instructions, and meta-tooling that attempted to model
framework and architecture semantics outside the compiler, linter, tests, and
CI. That surface increased retrieval noise and allowed adapters to drift from
the repository's actual source of truth.

## Decision

Use portable, path-scoped repository guidance as the canonical context layer:

- root `AGENTS.md` contains only high-signal, always-relevant repository rules;
- nested `AGENTS.md` files contain local deltas for genuine subsystem boundaries;
- `.agents/skills` contains focused, reusable domain procedures loaded on demand;
- `CLAUDE.md`, `.claude/skills`, and Copilot instructions are thin adapters;
- `scripts/context-lint.mjs` checks structural integrity only;
- source, manifests, migrations, tests, ESLint, TypeScript, framework tooling,
  and CI own mechanically expressible correctness.

Reject generated context maps, project graphs, vendor-specific policy copies,
agent fleets, metrics, behavioral evaluations, and generic rule parsers. Keep
the optional Next.js devtools MCP narrow because it provides runtime/framework
information that static repository files cannot.

## Consequences

Agents start from a small portable contract and discover subsystem detail only
when a task enters that scope. Tool adapters cannot become competing sources of
truth, and standard tooling produces the primary correctness feedback. The
trade-off is that agents must inspect the repository for task-specific detail;
that is intentional because manifests and executable code change more reliably
than generated context summaries.

Historical execution plans and research remain available under clearly marked
archive/reference locations, but they are evidence rather than instructions.

## Alternatives considered

- Keep independent Claude, Copilot, and agent-tool policy bodies — rejected
  because duplicated doctrine drifts and conflicts.
- Maintain generated navigation and dependency/context graphs — rejected
  because the filesystem, manifests, and imports are already authoritative.
- Replace the old analyzer with a smaller generic analyzer — rejected because
  it would preserve a private correctness language; each invariant belongs to
  its standard mechanical owner or a focused security/test check.
- Add a model benchmark or agent orchestration program — rejected because this
  decision concerns repository engineering, not model evaluation.
