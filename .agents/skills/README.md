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
  canonical, tool-agnostic body must stay the single source of truth so other
  agents (Cursor, Gemini CLI, OpenHands…) read the same file. The shim is the
  thin adapter that keeps both properties — Claude-native discovery + one source
  of truth — without a hand-maintained copy of every description.
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

## Evaluation (eval-first)

Anthropic's authoring guidance is "build evaluations before writing extensive
documentation," so a skill is only done when the invocation is provable, not
when the docs feel complete.

- Ship `evals/evals.json` next to the canonical SKILL.md, in the schema
  documented by Anthropic's `skill-creator` plugin
  (`anthropics/claude-plugins-official` → `references/schemas.md`):
  ```json
  {
    "skill_name": "<kebab-name matching frontmatter>",
    "evals": [
      { "id": 1, "prompt": "...", "expected_output": "...",
        "files": [], "expectations": ["...checkable..."] }
    ]
  }
  ```
- `expectations` is an array of **bare strings** — objectively checkable
  pass/fail. Do not shape them as objects; that is injection drift against the
  grader (the field name is `expectations`, not `assertions`).
- 2 cases for a single-purpose skill, 3 for one with a positive path + a reject
  path + a second reject/edge path. Subjective skills (style, plan quality)
  may carry `prompt` + `expected_output` only.
- Write the failing pair (a bad invocation the skill should reject or reshape)
  before the happy path — that is the case that defends the `description`.

## Attached scripts

Ship executable helpers in `<skill>/scripts/` and point to them from `SKILL.md`
(e.g. `diagnosing-bugs/scripts/repro-loop.template.ps1`). Templates carry a
`.template` segment so they are copied, not run in place. A skill's `.ps1`
template is canonical on Windows (the repo's `AGENTS.md` shell is PowerShell 7);
ship a `.sh` twin only when cross-platform `bun run` fallback is needed.

## Evaluation files

`<skill>/evals/evals.json` carries the skill's test cases (see Evaluation
above). The gate does not parse it; the agent and `skill-creator` do.

## Subagent Extension Pattern

For high-risk or error-prone subsystems, you can add a specialized domain reviewer subagent:
1. Ensure the corresponding domain skill under `.agents/skills` has a populated `## Known Failure Modes` section.
2. Create a read-only subagent under `.claude/agents/<domain>-reviewer.md` that *references* the skill and relevant ADRs rather than duplicating them.
3. Add an optional, path-scoped checklist line recommending the reviewer under `## Verification` in `.agents/workflows/review-gate.md`.

## P0–P4 still win

Nothing in a skill overrides the security mandates, enforced config, or
conventions in `AGENTS.md`. Skills are P5 task recipes.
