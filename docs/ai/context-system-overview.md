---
description: Map of the Pumni Web OS AI context system and how instruction, recipe, and enforcement layers fit together.
when-to-load: When maintaining AI context, adding routes/skills/evals, or onboarding an agent to the context system.
---

# Context System Overview

Pumni Web OS uses a web-specific AI context system for a Next.js 16 App Router
monorepo. It is not a React Native context system. Mobile-only patterns such as
Expo Router, Reanimated, Skia, MMKV, outbox sync, and RN i18n rules are out of
scope unless this repo explicitly adds those technologies.

## Planes

### Instruction Plane

Instruction files tell the agent what to read and how to reason.

- `AGENTS.md`: root constitution, security mandates, priority stack, response
  format.
- `apps/web/AGENTS.md`: scoped Next.js 16 rules; read before writing Next.js
  app code.
- `docs/ai/index.md`: compact routing index.
- `docs/ai/agent-behavior.md`: execution workflow and retrieval discipline.
- `docs/ai/prompt-playbook.md`: risk levels and prompt handling.
- `docs/ai/task-routes/*.md`: context budgets by task type.
- `docs/conventions/*.md`: canonical engineering rules.
- `docs/architecture/overview.md`: package and boundary map.

### Recipe Plane

Recipes are reusable procedures for repeated work.

- `.agents/workflows/review-gate.md`: self-review before reporting done.
- `.agents/skills/*/SKILL.md`: task recipes added when a pattern repeats.
- `.agents/evals/*.md`: regression scenarios added when a rule needs explicit
  coverage beyond static scanning.

Skills and evals must remain web-specific. Do not add React Native recipes to
this repo.

### Enforcement Plane

Enforcement files make the context deterministic.

- `scripts/ai-context.manifest.json`: required files, scripts, wrappers, and
  validation schemas.
- `scripts/check-ai-context.mjs`: context structure, links, frontmatter, and
  wrapper validation.
- `scripts/check-secrets.mjs`: committed secret and env-file scan.
- `scripts/check-review-gate-rules.mjs`: static security and architecture
  checks for web roots.
- `scripts/run-ai-evals.mjs`: deterministic AI policy gate.

Current scan roots are web monorepo roots: `apps/web/src`, `packages`, and
`supabase/migrations`. Do not replace them with mobile roots like `src` or
`supabase/functions` unless those paths exist and are intentionally supported.

## Control Flow

1. User prompt arrives.
2. Agent reads `AGENTS.md`, then `docs/ai/index.md`.
3. Agent chooses a task route and loads only its required context.
4. Agent applies any relevant workflow or skill.
5. Agent edits within the route's scope.
6. Agent runs `bun run ai:check`, `bun run ai:eval`, and task-relevant code
   gates.
7. Agent reports changed files, validation, and remaining risks.

## Extending The System

Add a task route when agents repeatedly over-read or under-read context for a
task class. Keep each route under 4000 bytes and link to canonical docs instead
of duplicating them.

Add a skill when a repeated implementation pattern needs a checklist or template.
Every skill must have YAML frontmatter with `name` and `description`, an H1, and
`## Rules` plus `## Checklist`.

Add an eval when a prompt pattern or regression cannot be captured reliably by a
static rule. Every eval must have YAML frontmatter with `name`, `category`, and
`description`, an H1, and sections for `Scenario Goal`, `Mock Input Prompt`, and
`Evaluation Criteria`.

Add or change static rules only when the pattern is deterministic enough to avoid
false positives across normal Next.js web code.
