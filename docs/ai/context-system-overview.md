---
description: Map of the Pumni Web OS AI context system and how instruction, recipe, and enforcement layers fit together.
when-to-load: When maintaining AI context, adding routes/skills/evals, or onboarding an agent to the context system.
last-reviewed: 2026-06-19
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
- `CLAUDE.md`: Claude Code entry point; inherits `AGENTS.md` via `@AGENTS.md`
  and adds Claude-specific session notes. Keep under 200 lines.
- `.claude/rules/*.md`: Claude Code scoped rules, lazy-loaded by glob pattern
  when the AI opens matching files. Use for dense, file-type-specific rules
  (e.g., Next.js async APIs, cache component placement) that would bloat global
  context if always loaded.
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
  wrapper validation; also checks eval-to-rule mapping, review-gate rule
  inventory, and golden-example path existence.
- `scripts/check-secrets.mjs`: committed secret and env-file scan.
- `scripts/review-gate-rules.mjs`: single source of truth for static rule ids,
  severities, fixes, and summaries.
- `scripts/check-review-gate-rules.mjs`: static security and architecture
  checks for web roots, with a self-test fixture for every static rule.
- `scripts/run-ai-evals.mjs`: deterministic AI policy gate with static rule
  coverage reporting.
- `scripts/sync-project-graph.mjs`: regenerates the dependency graph in
  `docs/architecture/project-graph.md` from real `workspace:*` edges; `ai:check`
  fails if the committed graph drifts (run `bun run ai:graph:sync` to fix).

Enforcement also covers **freshness**: every file in `frontmatterRequired`
carries `last-reviewed: YYYY-MM-DD`. `checkFreshness` warns past 180 days and
fails past 365. Ownership of every enforced path is declared in
`.github/CODEOWNERS`, so a PR touching a doc auto-requests its owner. See
`docs/ai/context-maintenance.md` → Freshness Policy for the full rule.

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

## Prompt-cache layout

Keep instruction context **stable** so a client that caches prompts can reuse
it across turns. This is a file-organisation principle, not infrastructure:

- Put durable rules in fixed paths: `AGENTS.md`, `apps/web/AGENTS.md`,
  `packages/*/AGENTS.md`, and `docs/conventions/*`. These change rarely.
- Keep volatile detail (current task, scratchpad notes, session state) out of
  those files — in chat turns or `.agents/scratchpad/` (see
  `docs/ai/memory-layer.md`).
- Do not duplicate a canonical rule into a second file; link to it instead.
  Duplicates drift, and drift defeats the cache and confuses the priority stack.
- Size caps (`AGENTS.md` < 6500 bytes, `docs/ai/*.md` < 5000 bytes, task routes
  < 4000 bytes) keep the static prefix small and predictable.

## Extending The System

Add a task route when agents repeatedly over-read or under-read context for a
task class. Keep each route under 4000 bytes and link to canonical docs instead
of duplicating them.

Add a skill when a repeated implementation pattern needs a checklist or template.
Every skill must have YAML frontmatter with `name` and `description`, an H1, and
`## Rules` plus `## Checklist`.

Add an eval when a prompt pattern or regression needs durable coverage. Every
eval must have YAML frontmatter with `name`, `category`, `description`, and
either `automated-rule: <static-rule-id>` or `manual: true`; use
`covered-rules: [...]` when one eval intentionally covers multiple static
rules. It must also have an H1 and sections for `Scenario Goal`, `Mock Input
Prompt`, and `Evaluation Criteria`.

Add or change static rules only when the pattern is deterministic enough to avoid
false positives across normal Next.js web code. When a static rule changes,
update `scripts/review-gate-rules.mjs`, its self-test fixture, eval coverage,
and the Static Rule Inventory in `.agents/workflows/review-gate.md` in the same
diff.
