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
- A thin shim mirrors it at `.claude/skills/<kebab-name>/SKILL.md` so Claude Code
  surfaces it. The shim carries the **same frontmatter** and a one-line pointer
  back to the canonical file — nothing else.
- List the skill in `docs/ai/index.md` under `## Skills`.

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
auth, and cache invalidation. Use when adding or changing an action in
features/<feature>/actions.ts, handling a form mutation, or wiring
updateTag/revalidateTag.
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

## The `## Checklist` is the completion contract

It is the agent's exit criteria — sharp, exhaustive, verifiable. End it with the
gate that proves the work (`bun run ai:check`, `bun run typecheck`, `bun run
test`, or `bun run ai:eval`). Sharp criteria defend against premature completion;
split a long step sequence only if the criteria stay irreducibly fuzzy.

## Pruning discipline

- Single source of truth per meaning — no duplication across skill and docs.
- No-op test: read each sentence and ask "does this change behavior versus the
  default?" Delete whole sentences that fail.
- Combat sediment: when a convention moves, update or delete the line; do not
  layer a new one on top.

## Attached scripts

Ship executable helpers in `<skill>/scripts/` and point to them from `SKILL.md`
(e.g. `diagnosing-bugs/scripts/repro-loop.template.sh`). Templates carry a
`.template` segment so they are copied, not run in place.

## P0–P4 still win

Nothing in a skill overrides the security mandates, enforced config, or
conventions in `AGENTS.md`. Skills are P5 task recipes.
