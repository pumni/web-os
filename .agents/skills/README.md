# Pumni Skill Authoring Standard

How every skill under `.agents/skills/` must be written. A skill exists to
**wrangle determinism out of a stochastic system**: it makes the agent repeat the
same *process*, not produce the same output. Optimise for predictability, then
for the fewest tokens that preserve it.

Adapted from Matt Pocock's `writing-great-skills`, constrained to this repo's
validation gate (`scripts/check-ai-context.mjs`).

## Layout (enforced)

- One skill per directory: `.agents/skills/<kebab-name>/SKILL.md` is canonical
  and tool-agnostic.
- A thin shim at `.claude/skills/<kebab-name>/SKILL.md` lets Claude Code surface
  the skill. The shim is **generated** from the canonical file by `bun run
  ai:skills:sync` (`name` + `description` + a pointer) — never hand-edit it.
  `bun run ai:check` fails if a shim is missing, stale, or orphaned.

  Why: Claude Code discovers project skills from `.claude/skills/`, but the
  canonical, tool-agnostic body must stay the single source of truth so any
  AGENTS.md-reading agent reads the same file. The shim is the
  thin adapter that keeps both properties — Claude-native discovery + one source
  of truth — without a hand-maintained copy of every description.
- List the skill in the root `AGENTS.md` navigation table under `.agents/skills/`.

## Gate requirements (hard — `bun run ai:check` fails otherwise)

Every `.agents/skills/<name>/SKILL.md` must have:

- YAML frontmatter with `name` and `description`.
- An H1 title.
- A `## Rules` section.
- A `## Checklist` section.

`description` must match between the canonical file and its `.claude` shim.

## Description = the invocation surface

The `description` is the only thing the model sees when deciding whether to fire
the skill. Write it for the model, not for a human menu:

- Front-load the leading word (the verb/noun the agent already associates with
  the task).
- End with an explicit **trigger clause**: `Use when …` listing the concrete
  situations (file paths, actions, symptoms) that should pull the skill in.
- One trigger per distinct branch; collapse synonyms. Strip identity already in
  the body.

```
description: Build Next.js Server Actions with Zod validation, server-derived
auth, and cache invalidation. Use when adding or changing a server-side mutation in
features/<feature>/actions.ts, or wiring updateTag/revalidateTag. For client
form wiring, use react-hook-form.
```

## Information hierarchy (most immediate first)

1. **Steps** — ordered actions that end on a checkable completion criterion.
   Use when the task is sequential (`## Process` / `## Loop`).
2. **Rules** — definitions, invariants, and facts consulted on demand
   (`## Rules`).
3. **External reference** — exact tables, long recipes, and rarely-needed detail
   go in a sibling file (`REFERENCE.md`, `DEEPENING.md`, …) reached by a pointer.
   Keep `SKILL.md` short and legible.

Progressive disclosure is the cure for **sprawl**: when `SKILL.md` grows tables
or recipes, move them out and link, as `ui-styling/REFERENCE.md` does.

## Known Failure Modes (Recommended)

Error-prone domains SHOULD add a `## Known Failure Modes` section (placed after `## Rules` and before `## Checklist`) carrying a compact table of `Symptom | Cause | Fix`, distilled from real debugging sessions or ADRs. Never author LLM-generated filler; keep the table high-signal and limited to 3-6 critical rows. Single-use or trivial skills may omit it.

## The `## Checklist` is the completion contract

It is the agent's exit criteria — sharp, exhaustive, verifiable. End it with the
gate that proves the work (`bun run ai:check`, `bun run typecheck`, `bun run
test`, or `bun run ai:eval`). Sharp criteria defend against premature completion;
split a long step sequence only if the criteria stay irreducibly fuzzy.

`bun run ai:check` enforces that the section names how completion is verified
(a gate command or an explicit checkable criterion).

## Pruning discipline

- Single source of truth per meaning — no duplication across skill and docs.
- No-op test: read each sentence and ask "does this change behavior versus the
  default?" Delete whole sentences that fail.
- Combat sediment: when a convention moves, update or delete the line; do not
  layer a new one on top.

## Verification

Skills are verified structurally by the context gate (`bun run ai:check`), which enforces frontmatter, H1/Rules/Checklist sections, shim synchronization, and size budgets. Completion of a task using a skill is verified by executing the commands listed in that skill's `## Checklist` section. The dynamic behavioral evaluation instrument and `evals/evals.json` test cases are retired (ADR-0026 Deprecated).

## Attached scripts

Ship executable helpers in `<skill>/scripts/` and point to them from `SKILL.md`
(e.g. `diagnosing-bugs/scripts/repro-loop.template.ps1`). Templates carry a
`.template` segment so they are copied, not run in place. A skill's `.ps1`
template is canonical on Windows (the repo's `AGENTS.md` shell is PowerShell 7);
ship a `.sh` twin only when cross-platform `bun run` fallback is needed.



## Subagent Extension Pattern

For high-risk or error-prone subsystems, you can add a specialized domain reviewer subagent:
1. Ensure the corresponding domain skill under `.agents/skills` has a populated `## Known Failure Modes` section.
2. Create a read-only subagent under `.claude/agents/<domain>-reviewer.md` that *references* the skill and relevant ADRs rather than duplicating them.
3. Add an optional, path-scoped checklist line recommending the reviewer under `## Verification` in `.agents/skills/review-gate/SKILL.md`.

## Skill Activation & Invocation Policy

Skill activation is outcome-based. Use a relevant skill when its specialized process, references or attached scripts reduce uncertainty. Native agent workflows are acceptable when they satisfy the same project invariants and verification criteria.

## Skill Taxonomy

Every skill under `.agents/skills/` belongs to one of five logical categories:

- **procedure**: Guided multi-step creation or modification flows (e.g. `feature-module`, `refactor-plan`, `server-action`).
- **diagnostic**: Systematic root-cause investigation workflows (e.g. `diagnosing-bugs`).
- **review**: Verification and self-audit gates (e.g. `review-gate`, `context-health`).
- **reference**: Curated domain-specific vocabulary and standards (e.g. `domain-modeling`, `ui-styling`).
- **generator**: Code or test scaffold helpers (e.g. `testing-template`, `zod-validator`).

## Standard Authority

Nothing in a skill overrides platform safety, direct user intent, or canonical repository invariants in `AGENTS.md`. Skills provide task-scoped process guidance.
