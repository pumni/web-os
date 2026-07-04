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

## Next.js 16 (auto-loaded by glob; read directly when editing app code)

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
| MCP servers (next-devtools runtime + postgres schema, optional) | `docs/ai/mcp.md` |
| Repo map for external agents/tools (agentic handshake) | `llms.txt` |

## Skills (reusable procedures in `.agents/skills`)

Claude Code auto-surfaces these by description via thin shims in
`.claude/skills/<name>/SKILL.md`; the canonical, tool-agnostic content lives in
`.agents/skills` (the shims just point back to it). How to write or change a
skill: `.agents/skills/README.md` (authoring standard).

| Repeated task | Skill |
| --- | --- |
| Scope a vague request before coding | `.agents/skills/grill-requirements/SKILL.md` |
| Scaffold a feature vertical slice | `.agents/skills/feature-module/SKILL.md` |
| Next.js Server Action | `.agents/skills/server-action/SKILL.md` |
| Server Component read + Next 16 cache | `.agents/skills/server-component-read/SKILL.md` |
| @pumni/ui styling / tokens / surfaces | `.agents/skills/ui-styling/SKILL.md` |
| Supabase migration / RLS / grants | `.agents/skills/supabase-migration/SKILL.md` |
| TanStack Query hook or mutation | `.agents/skills/tanstack-query-hook/SKILL.md` |
| Client form (RHF + Zod + Server Action) | `.agents/skills/react-hook-form/SKILL.md` |
| Shared Zod input schema in @pumni/validators | `.agents/skills/zod-validator/SKILL.md` |
| Watch-together playback sync (reducer / anchors / clock) | `.agents/skills/watch-sync/SKILL.md` |
| Zustand client UI store | `.agents/skills/zustand-store/SKILL.md` |
| Deterministic unit/component testing | `.agents/skills/testing-template/SKILL.md` |
| Dependency version updates (Bun catalog tiers) | `.agents/skills/dependency-update/SKILL.md` |
| Disciplined bug diagnosis / repro loops | `.agents/skills/diagnosing-bugs/SKILL.md` |
| Deep modules / testable interfaces | `.agents/skills/codebase-design/SKILL.md` |
| Glossary & domain term discipline | `.agents/skills/domain-modeling/SKILL.md` |

## Verification

See `docs/ai/agent-command-policy.md#validation` (altitude table) for the
gate that matches your change scope.

## Workflows

| Need | Load |
|---|---|
| Self-review your diff before reporting "done" | `review-gate` → `.agents/workflows/review-gate.md` |
