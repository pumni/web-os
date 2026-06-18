# 0007. Context Efficiency 2026

- **Status:** Accepted
- **Date:** 2026-06-19
- **Owner:** AI context layer (see `docs/ai/index.md`)

## Context

The 2026-06-19 context-footprint measurement found three high-cost gaps:

1. `docs/conventions/design-system.md` was a 32.6 KB outlier inside
   `docs/conventions/*`, forcing UI tasks to load roughly 8K tokens of reference
   tables before editing.
2. Meta-inversion remained after ADR-0005 and ADR-0006: `docs/ai/*` still held
   about 39 KB, including overlapping `agent-behavior.md` and
   `prompt-playbook.md` guidance.
3. Package-scoped `AGENTS.md` coverage was 3/8; `config`, `env`, `features`,
   `test-utils`, and `validators` lacked nearest-file guidance.

This continues ADR-0005 and ADR-0006. It aligns with the agents.md nested-file
model, Agent Skills progressive disclosure, and the "smallest high-signal
tokens" principle without weakening the enforcement plane.

## Decision

Perform a context-efficiency pass:

1. Split the design-system reference layer into a trimmed
   `docs/conventions/design-system.md` plus the on-demand
   `.agents/skills/ui-styling/SKILL.md` skill.
2. Merge the historical prompt-playbook content into
   `docs/ai/agent-behavior.md` and remove that old file from the manifest,
   index, and `llms.txt`.
3. Add package-scoped `AGENTS.md` files for `packages/config`, `packages/env`,
   `packages/features`, `packages/test-utils`, and `packages/validators`.
4. Keep `docs/ai/agent-command-policy.md` separate as the PowerShell 7 command
   discipline SSOT per ADR-0006.
5. Do not migrate the static analyzer to AST form in this pass; that remains a
   separate ADR-0002 follow-up.

## Consequences

Positive:

- UI tasks load the short design-system hard rules by default and pull reference
  tables only through the `ui-styling` skill.
- The prompt/risk/mini-PRD operating manual has one owner:
  `docs/ai/agent-behavior.md`.
- Package guidance coverage increases from 3/8 to 8/8 without adding those new
  package files to manifest-required global context.

Costs:

- One new skill must stay aligned with `@pumni/ui` token and component behavior.
- Five new package files must be maintained with package boundaries.
- Historical ADR references to prompt-playbook remain as history, but enforced
  surfaces must not point to the deleted file.

## Alternatives considered

- **Delete `design-system.md` entirely.** Rejected: code comments, lint messages,
  and the canonical index depend on that path.
- **Merge `agent-command-policy.md` into `agent-behavior.md`.** Rejected:
  ADR-0006 keeps command policy as the canonical PowerShell 7 SSOT.
- **Add the five new package `AGENTS.md` files to manifest `requiredFiles`.**
  Rejected for this pass: nearest-file guidance is useful on demand, but making
  all package files always required would raise maintenance cost.
- **Build the AST analyzer now.** Rejected as out of scope and deferred by the
  ADR-0002 analyzer follow-up.
