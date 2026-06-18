# 0003. Cursor `.mdc` and Claude `settings.json` Permission Allow-Deny

- **Status:** Accepted (decision: defer adoption)
- **Date:** 2026-06-19
- **Owner:** AI context layer (see `docs/ai/index.md`)

## Context

Two IDE-/tool-native guardrails exist in the 2026 context-layer toolkit:

1. **Cursor `.mdc` rules** — glob-scoped, lazily-loaded rule files (e.g. a rule
   that fires only when editing `apps/web/src/app/**/page.tsx`). They deliver
   the right rule to the right file at the right time, IDE-native.
2. **Claude `settings.json` permission allow-deny** — restricts which files and
   tools an agent may touch, a hard boundary enforced by the harness.

The repo's earlier audit (`docs/plans/ai-context-audit.md`) framed "no Cursor
`.mdc` / Claude `settings.json` permission allow-deny" as a *deliberate choice*.
That framing risks becoming rationalization: these are a legitimate
defense-in-depth layer. The question is whether the repo has *evidence* that the
current guards miss something they would catch.

What already exists:

- A glob-scoped rule layer at `.claude/rules/` (two files:
  `.claude/rules/nextjs-async-apis.md` and `.claude/rules/nextjs-cache-components.md`),
  scoped to App Router and feature query/action globs. This is the same
  glob-scoped pattern `.mdc` provides, just Claude-flavored and already in place.
- A static analyzer (`scripts/check-review-gate-rules.mjs`, 16 rules, 16/16
  eval-covered) plus the manifest-enforced plane (`bun run ai:check`) and the
  review-gate workflow (`.agents/workflows/review-gate.md`).

### The data question

The decisive question is: **has any agent ever made a mistake that the static
analyzer did not catch, but an `.mdc` or `settings.json` rule would have?**
Checked at decision time:

- `bun run ai:eval` — green, 16/16 static rules covered, 10 evals.
- `docs/ai/MEMORY.md` — no recorded agent-mistake incidents.
- `scripts/ai-metrics.mjs` regression signal — clean.
- No PR-review agent-mistake data is accessible from this session.

No such incident is on record. Without a concrete gap, adopting either guardrail
is speculative layering.

## Decision

**Defer adoption of Cursor `.mdc` rules and Claude `settings.json` permission
allow-deny.** Continue to rely on the existing guards: the glob-scoped
`.claude/rules/` layer, the static analyzer, the manifest plane, and the
review-gate workflow.

This is a *recorded* defer with an explicit re-open trigger — not "we haven't
thought about it". The analysis below exists so the question is not re-litigated
on every audit.

## Consequences

**Positive:**

- No new tool-specific surface to maintain (`.mdc` is Cursor-only; `settings.json`
  is Claude-only — both diverge from the tool-agnostic manifest + analyzer that
  every agent reads via `AGENTS.md`).
- No duplication of the glob-scoped rules already living in `.claude/rules/`.
- The existing defense-in-depth (static analyzer + manifest + review gate)
  remains the single, tool-agnostic source of enforcement.

**Negative / costs:**

- No IDE-native, file-touch-time guardrail for tools that would otherwise read
  `.mdc` / `settings.json`. A mistake that slips the analyzer is not caught at
  the IDE either. Mitigated by the re-open trigger below.
- Cursor users do not get Cursor-native rule delivery; Claude users do not get a
  harness-level allow-deny. Both still get the tool-agnostic layer.

**Neutral:**

- The glob-scoped pattern is already proven in this repo via `.claude/rules/`; a
  future move to `.mdc` would be a *port* of existing content, not new authoring.

## Re-open trigger

Re-open this ADR when **any** of these is observed:

- An agent mistake that passes `bun run ai:check` and `bun run ai:eval` but
  would have been caught by a glob-scoped `.mdc` rule or a `settings.json`
  allow-deny.
- A recorded incident in `docs/ai/MEMORY.md` attributable to a missing
  file-touch-time or permission guardrail.
- Onboarding data showing agents repeatedly make the same class of error the
  static analyzer was not designed to catch.

When re-opened, prefer the option whose guardrail is closest to the observed gap
(.mdc for content-delivery gaps; settings.json for permission/blast-radius gaps).

## Alternatives considered

- **Adopt Cursor `.mdc` rules now.** Rejected: would duplicate the glob-scoped
  content already in `.claude/rules/`, and `.mdc` is Cursor-only (other tools
  ignore it). No data shows the existing globs under-deliver. Adopt when a
  Cursor-specific delivery gap appears.

- **Adopt Claude `settings.json` permission allow-deny now.** Rejected: a hard
  allow-deny is a real boundary, but the manifest + analyzer + RLS already bound
  the blast radius at the levels that matter (git-tracked files, server secrets,
  data access). A tool-specific permission file adds maintenance and can conflict
  with the tool-agnostic enforcement plane. Adopt when a permission/blast-radius
  gap the analyzer cannot express is observed.

- **Adopt both now as defense-in-depth.** Rejected for the same reason: layering
  without an observed gap is speculative. Defense-in-depth is justified by a
  failure mode, not by checklist completeness.

## References

- `docs/plans/ai-context-audit.md` — the audit that flagged this as a gap.
- `.claude/rules/nextjs-async-apis.md`, `.claude/rules/nextjs-cache-components.md`
  — the glob-scoped layer already in place.
- `scripts/check-review-gate-rules.mjs`, `docs/ai/MEMORY.md`,
  `scripts/ai-metrics.mjs` — the data sources checked for the decision.
