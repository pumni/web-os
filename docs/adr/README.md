# Architecture Decision Records

ADRs record the durable “why” behind non-obvious architectural decisions.
Executable behavior remains owned by source code, configuration, migrations,
tests, and CI; an ADR never overrides those sources.

## When to write one

Write an ADR when a decision is difficult to reverse, rejects an obvious
alternative, or establishes a convention across packages or routes.

Do not write one for naming, reversible styling, behavior already enforced by
configuration, or routine documentation and context maintenance. Add context or
a skill only after a measured recurring failure shows that existing source,
tests, instructions, and normal repository exploration are insufficient.

## Format

Every ADR uses a zero-padded monotonic filename (`NNNN-kebab-title.md`) and
starts with:

```md
# NNNN. Title

- **Status:** Proposed | Accepted | Deprecated | Superseded by ADR-0XXX
- **Date:** YYYY-MM-DD
- **Owner:** role or team
```

Then use these four sections, in order:

1. Context
2. Decision
3. Consequences
4. Alternatives considered

## Lifecycle

Use status transitions to show the current decision: Proposed → Accepted →
Deprecated → Superseded. A replacement ADR must reference the decision it
supersedes, and the older record must point to the replacement.

Only current, load-bearing ADRs remain in the tree. Retired, superseded, or
implementation-history decisions are removed after their current outcome is
captured by a surviving ADR, convention, source, or test. Git history is the
record for the deleted document; its number remains burned and is never reused.

The filesystem is the ADR register. No generated index or synchronization
command is required.
