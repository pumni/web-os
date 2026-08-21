# 0022. Keep `llms.txt` as an Agentic Handshake Map

- **Status:** Superseded by [ADR-0027](0027-context-layer-v2-standards-alignment.md)
- **Date:** 2026-07-01
- **Owner:** Engineering Team

## Context

The repository once considered a short `llms.txt` entry map useful for agents.
That decision predated the portable `AGENTS.md` and scoped-guide architecture.

## Decision

This decision is superseded. `AGENTS.md` and the actual repository tree are the
portable entry surface; `llms.txt` is not a second canonical navigation or
policy document.

## Consequences

The older handshake decision remains in history for traceability, while current
context guidance has one portable owner and no generated map dependency.

## Alternatives considered

- Keep a separate handshake map as current policy — rejected by ADR-0027 because
  it duplicates the repository's portable context surface.
