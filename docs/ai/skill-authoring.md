---
description: Rules for writing and maintaining Pumni agent skills and workflows without adding instruction sprawl.
when-to-load: Before creating or substantially editing `.agents/skills/*`, `.agents/workflows/*`, or AI routing docs.
---

# Skill Authoring

Agent instructions should make future runs more predictable without competing
with `AGENTS.md`, enforced config, architecture docs, or local evidence.

## Skill vs Workflow

- **Skill**: reusable discipline the agent may invoke when a task matches its
  description, such as bug diagnosis, styling, or Supabase migrations.
- **Workflow**: user-invoked or router-invoked orchestration for a phase of work,
  such as triage, PRD drafting, issue slicing, handoff, or architecture review.

Use a skill when the trigger should be automatic. Use a workflow when the user
or `docs/ai/flow-router.md` should choose the phase.

## Writing Rules

- Keep one source of truth. Link to canonical docs instead of restating their
  rules.
- Make descriptions trigger-rich. The description is what lets the agent choose
  the skill before reading the body.
- Put steps before reference. A future agent should see what to do before seeing
  background material.
- End non-trivial steps with a checkable completion criterion.
- Prefer project terms from `docs/ai/domain-language.md`.
- Split only when a separate trigger, phase, or reference file reduces context
  load.
- Delete no-op prose: if a sentence does not change agent behavior, remove it.

## Required Checks

Before adding or editing an AI instruction file:

- [ ] The new rule cannot override P0 security or P1 enforced config.
- [ ] The file links to canonical owners instead of duplicating broad policy.
- [ ] The trigger belongs in the description or router, not only in body text.
- [ ] Completion criteria are observable.
- [ ] The instruction is scoped to a real repeated task.
- [ ] `docs/ai/index.md` and `docs/ai/flow-router.md` are updated when discovery
      changes.

## Validation

Run `bun run ai:check` after AI context edits. Run `bun run ai:eval` when the
change affects security, trust boundaries, review behavior, or prompt-injection
handling.
