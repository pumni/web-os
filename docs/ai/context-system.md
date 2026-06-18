---
description: Map of the Pumni Web OS AI context system, including instruction, recipe, enforcement planes, maintenance triggers, and drift risks.
when-to-load: When maintaining context, adding rules/skills/evals, or updating conventions.
---

# Context System

Pumni Web OS uses a web-specific AI context system for a Next.js 16 App Router monorepo. It is not a React Native context system. Mobile-only patterns are out of scope.

## Planes

### 1. Instruction Plane
Instruction files tell the agent what to read and how to reason.
- `AGENTS.md`: Root constitution, security mandates, priority stack, response format.
- `CLAUDE.md`, `GEMINI.md`, `CODEX.md`: Compatibility wrappers routing to `AGENTS.md`. Keep under 1500 bytes.
- `.claude/rules/*.md`: Scoped rules, lazy-loaded by glob pattern (e.g. async APIs, cache component placement).
- `apps/web/AGENTS.md`: Scoped Next.js 16 App Router and cache rules.
- `docs/ai/index.md`: Compact routing index.
- `docs/ai/agent-behavior.md`: Execution workflow and subagent delegation.
- `docs/ai/prompt-playbook.md`: Risk levels and mini-PRD template.
- `docs/ai/task-routes/*.md`: Context budgets by task type.
- `docs/conventions/*.md`: Canonical engineering rules.
- `docs/architecture/overview.md`: Package and boundary map.

### 2. Recipe Plane
Recipes are reusable procedures for repeated work.
- `.agents/workflows/review-gate.md`: Self-review checklist.
- `.agents/skills/*/SKILL.md`: Task recipes (e.g., server-action, zustand-store).
- `.agents/evals/*.md`: Behavioral prompt-injection scenarios.

### 3. Enforcement Plane
Enforcement files make the context deterministic.
- `scripts/ai-context.manifest.json`: Required files, scripts, and wrappers.
- `scripts/check-ai-context.mjs`: Validates context structures, links, and freshness.
- `scripts/check-secrets.mjs`: Committed secrets scan.
- `scripts/review-gate-rules.mjs` & `check-review-gate-rules.mjs`: Static security/architecture rules and self-tests.
- `scripts/run-ai-evals.mjs` & `run-behavioral-evals.mjs`: Automation rule stats and behavioral scenarios gate.
- `scripts/sync-project-graph.mjs`: Syncs dependency graph.

Enforcement also covers **Freshness**: file age is git-derived (`git log -1`). Age > 180 days warns; > 365 days fails the check.

## Control Flow
1. **Prompt:** User prompt arrives.
2. **Orient:** Read `AGENTS.md` -> `docs/ai/index.md`.
3. **Route:** Select task route, load only its required budget.
4. **Apply:** Execute relevant workflows or skills.
5. **Edit:** Surgical changes inside route scope.
6. **Validate:** Run `bun run ai:check` and `bun run ai:eval`.
7. **Report:** Declare changed files, validation, and risks.

## Prompt-Cache Layout
Keep instruction context **stable** for prompt caching:
- Fixed paths: `AGENTS.md`, `apps/web/AGENTS.md`, `docs/conventions/*`.
- Volatile data: Keep current task, scratchpad out of static files.
- Link, don't duplicate: Duplicates confuse the priority stack and break the cache.
- Size caps: `AGENTS.md` < 6500 bytes, `docs/ai/*.md` < 5000 bytes, task routes < 4000 bytes.

## Extending the System
- **Routes:** Add when agents repeatedly over-read/under-read. Keep < 4000 bytes.
- **Skills:** Add for repeated checklist/template implementation patterns.
- **Evals:** Add for behavioral prompt-injection regression scenarios.
- **Static Rules:** Add to `review-gate-rules.mjs` + analyzer + self-test + inventory table in `review-gate.md`.

## Triggers & Maintenance
Review AI context when:
- Framework versions (Next.js, Supabase, TanStack Query, Zustand) or conventions change.
- A new package is added under `packages/` or a new data access/migration pattern is established.
- Agents repeat a wrong implementation pattern twice.
- Static gates or workflows are added/modified.
- Checklist: Verify manifest, check all links, run `ai:check` and `ai:eval`.

## Drift Risks
Watch for these web-os-specific drift points:
- Next.js cache APIs (`cacheTag`, `cacheLife`, `updateTag`, `revalidateTag`).
- Server-only helpers imported into client components.
- Service-role key leaks outside server-only modules.
- Server data mirrored into Zustand.
- Async request APIs used without `await`.
- Unparameterized `cacheTag()`, causing cross-user cache collisions.
- `'use cache'` placed inside wrapper functions (losing cache benefit).
- `.claude/rules/*.md` rules drifting out of sync with `apps/web/AGENTS.md`.
