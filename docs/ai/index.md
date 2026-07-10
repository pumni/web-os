# Pumni Web OS — AI Knowledge Index

The single router after `AGENTS.md`. Start at `AGENTS.md` (security + priority +
command discipline), then load **only** the rows below that match the task. The
harness handles task routing, planning, and delegation — this file just maps a
need to the canonical doc that owns it.

## Conventions (the actual engineering rules)

| Need | Load |
| --- | --- |
| Architecture & package boundaries | `docs/architecture/overview.md` |
| Dependency graph & blast radius | `docs/architecture/project-graph.md` |
| Server / Client boundary | `docs/conventions/server-client-boundary.md` |
| Data fetching (Server Components / Query / Zustand) | `docs/conventions/data-fetching.md` |
| Feature module layout | `docs/conventions/feature-module.md` |
| Design system (OKLCH tokens, surfaces, motion) | `docs/conventions/design-system.md` |
| Supabase / RLS / keys | `docs/conventions/supabase-security.md` |
| Testing scope & commands | `docs/conventions/testing.md` |
| transpilePackages (monorepo Next.js) | `docs/conventions/transpile-packages.md` |
| Quality gates | `docs/quality-gates.md` |

## Next.js 16 (always-loaded on Claude Code; read directly when editing app code)

| Need | Load |
| --- | --- |
| Async request APIs (`params`/`cookies`/`headers`) | `.claude/rules/nextjs-async-apis.md` |
| Cache components (`'use cache'`, `cacheLife`, tags) | `.claude/rules/nextjs-cache-components.md` |

## Reference (load on demand)

| Need | Load |
| --- | --- |
| Shell command discipline (PowerShell 7) | `docs/ai/agent-command-policy.md` |
| Domain glossary | `docs/ai/domain-language.md` |
| Local production patterns to copy | `docs/ai/golden-examples.md` |
| Known ❌/✅ mistake pairs | `docs/ai/common-mistakes.md` |
| MCP servers (pinned versions; fallback when offline) | `docs/ai/mcp.md` |
| Repo map for external agents/tools (agentic handshake) | `llms.txt` |
| Long-term settled-decision log | `docs/ai/MEMORY.md` |

## Playground Surfaces

- `apps/web/src/features/sky-player`, `apps/web/src/features/design-trends`, `apps/web/src/app/(app)/todos` are playground/demo surfaces only. Do not apply full feature-module requirements; however, P0 security mandates (RLS/auth) still apply if they touch any server resource.

## Tool Support Matrix

Non-Claude agents read `AGENTS.md` + canonical skills declaratively
(advisory); Claude Code adds hooks + subagent + path-rules enforcement on top.

| Capability | Path | Claude Code | Other agents |
|---|---|---|---|
| Entry contract (P0–P6) | `AGENTS.md` | via `CLAUDE.md` | reads |
| Handshake map | `llms.txt` | fetched | fetched |
| Need→doc router | `docs/ai/index.md` | on demand | on demand |
| Long-term memory | `docs/ai/MEMORY.md` | manual | manual |
| Path-scoped rules | `.claude/rules/*.md` (`globs:`) | always loaded | — |
| Skill discovery | `.agents/skills/*/SKILL.md` | fires by desc | per spec |
| Skill shim | `.claude/skills/<name>/SKILL.md` | generated, do not hand-edit | — |
| Subagent reviewers | `.claude/agents/*-reviewer.md` | dispatched from `review-gate.md` | — |
| Lifecycle hooks | `.claude/hooks/*.mjs` | enforce `ai:check` on edits | — |
| MCP servers | `.mcp.json` | opt-in, dev-only | any MCP client |
| Validation gates | `bun run ai:check`/`ai:eval` | manual + Stop hook | manual |

## Skills (reusable procedures in `.agents/skills`)

17 skills live in `.agents/skills/<name>/SKILL.md` (canonical, tool-agnostic);
Claude Code surfaces them by description via generated
`.claude/skills/<name>/SKILL.md` shims (do not hand-edit — run
`bun run ai:skills:sync`). Authoring standard: `.agents/skills/README.md`.
See `.agents/skills/domain-modeling/SKILL.md` and siblings for the inventory.

## Verification

See `docs/ai/agent-command-policy.md#validation` (altitude table) for the
gate that matches your change scope.

## Workflows

| Need | Load |
|---|---|
| Self-review your diff before reporting "done" | `review-gate` → `.agents/workflows/review-gate.md` |
