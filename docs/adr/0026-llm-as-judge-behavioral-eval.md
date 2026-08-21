# 0026. Behavioral Evaluation Instrument (Retired)

- **Status:** Deprecated (2026-07-18)
- **Date:** 2026-07-10
- **Owner:** platform / AI context layer

## Context

An experimental behavioral-evaluation instrument attempted to compare agent
responses against context-layer tasks. Its pattern-based grader measured wording
more reliably than behavior, and the proposed judge layer had no calibrated,
repeatable owner.

## Decision

Retire the instrument and do not maintain an agent/model benchmark program in
the repository. This ADR is a historical record, not an executable procedure
or a current quality gate. Repository correctness is established by the normal
typecheck, lint, build, focused test, security, and context gates owned by the
relevant tools and source modules.

## Consequences

There is no behavioral-evaluation runner, judge workflow, rubric contract, or
metrics artifact to keep synchronized. Any future measurement proposal needs a
new decision record with an explicit owner, reproducible signal, and approval
before adding tooling or CI behavior.

## Alternatives considered

Keeping a regex grader or adding an LLM judge was rejected because neither had
demonstrated a trustworthy signal for this repository's security and architecture
decisions.
