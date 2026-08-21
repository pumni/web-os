# 0003. Tool-Native Permission and Path-Scoped Rules

- **Status:** Accepted
- **Date:** 2026-06-19
- **Owner:** Engineering Team

## Context

Cursor and Claude offer tool-native path-scoped rules and permission
allow/deny files. They could provide additional delivery or blast-radius
controls, but every extra vendor surface can drift from portable repository
guidance. No recorded incident currently demonstrates a gap that requires one
of these tool-specific mechanisms.

## Decision

Defer adopting Cursor-specific rule files and Claude permission allow/deny
policy. Keep canonical guidance in `AGENTS.md`, use meaningful nested guides
and focused skills for scope, and rely on standard repository gates plus the
security boundaries documented in the active conventions.

Revisit this decision only when a recorded agent failure shows that normal
repository exploration, portable instructions, source, tests, or existing
mechanical gates cannot catch the failure.

## Consequences

The repository maintains fewer vendor-specific policy surfaces and avoids
duplicating canonical rules. Tools do not receive an additional native
guardrail for an unproven failure mode; a concrete incident is required before
adding one.

## Alternatives considered

- Adopt both tool-native mechanisms immediately — rejected because layering
  without measured failure adds maintenance and conflict risk.
- Copy the full repository policy into each vendor directory — rejected because
  portable `AGENTS.md` must remain the source of truth.
