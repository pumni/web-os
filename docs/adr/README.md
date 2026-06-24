# Architecture Decision Records

This directory holds Architecture Decision Records (ADRs) for Pumni Web OS. An
ADR records **why** a non-obvious architectural decision was made — the "why"
that source code and conventions cannot carry on their own.

## Priority

ADRs sit at **P3** in the `AGENTS.md` priority stack (Architecture Decisions).
They rank below enforced config (P1) and architecture/conventions docs (P2), and
above local evidence (P4). An ADR explains a decision; it does not override a
gate. When a decision and an enforced config disagree, enforce the config and
update the ADR.

## When to write one

Write an ADR when a decision is:

- Hard to reverse (foundational package, data layer, auth boundary).
- Rejected an obvious alternative that future readers will re-propose.
- Establishes a convention that spans multiple packages or task routes.

Do **not** write one for:
- Trivial choices, naming, or anything already settled by an enforced config or conventions doc.
- Reversible visual/token tuning (update `docs/conventions/design-system.md` instead) — see ADR-0012's consolidation.

## Format (MADR-lite)

Every ADR file is Markdown and starts with this header:

```
# NNNN. <Title>

- **Status:** Proposed | Accepted | Deprecated | Superseded by ADR-0XXX
- **Date:** YYYY-MM-DD
- **Owner:** <role or team>
```

Followed by exactly four sections, in order:

1. **Context** — the problem, forces, and alternatives considered.
2. **Decision** — the choice made, stated concretely.
3. **Consequences** — positive, negative, and neutral effects; what we now must
   do or maintain.
4. **Alternatives considered** — what was rejected and why (prevents re-litigation).

## Lifecycle

- **Load-bearing ADRs are never deleted** — they evolve by status transition
  (`Proposed` → `Accepted` → `Deprecated` → `Superseded by ADR-0XXX`).
- **Cosmetic / same-week superseded ADRs may be squashed** into a single
  consolidated ADR. The consolidated record keeps **one** number (not
  necessarily the lowest — e.g. ADR-0009 consolidated three same-week 0005–0007
  drafts under 0009); the squashed drafts are preserved in git rather than as
  tombstone files, and their numbers are not reused. A token-value or
  visual-tuning change is a `docs/conventions/*` edit, **not** a new ADR.
- Status transitions only:
  `Proposed` → `Accepted` → `Deprecated` → `Superseded by ADR-0XXX`.
- To supersede, create a new ADR that references the old one by ID and update the
  old ADR's status line to point at the new one.

## Naming

`NNNN-kebab-title.md`, zero-padded to four digits, starting at `0001`. Numbers
are monotonic and never reused.

## Enforcement

ADRs are **not** in `scripts/ai-context.manifest.json`'s `requiredFiles` — they
have a different lifecycle (status transitions, never deleted) from the enforced
`docs/ai/*` set. However, any backtick reference to an existing ADR path (e.g.
`docs/adr/0001-structured-prompting-and-model-routing.md`) from an enforced doc
is validated by `checkDocPathReferences` in `bun run ai:check`, so a broken ADR
link still fails the gate.
