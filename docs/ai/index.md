# Pumni Web OS — AI Knowledge Index

Canonical owner: `docs/ai/index.md`. Compact lookup table — long-form knowledge lives in the linked files. Start here after `AGENTS.md`.

## Canonical Sources

| Need | Source |
| --- | --- |
| Tool-agnostic project rules | `AGENTS.md` |
| Claude Code entry point (inherits AGENTS.md) | `CLAUDE.md` |
| Next.js 16 async request APIs (glob-scoped) | `.claude/rules/nextjs-async-apis.md` |
| Next.js 16 cache components (glob-scoped) | `.claude/rules/nextjs-cache-components.md` |
| Next.js v16 scoped rules | `apps/web/AGENTS.md` |
| `@pumni/ui` package rules | `packages/ui/AGENTS.md` |
| `@pumni/supabase` package rules | `packages/supabase/AGENTS.md` |
| `@pumni/auth` package rules | `packages/auth/AGENTS.md` |
| Architecture & package boundaries | `docs/architecture/overview.md` |
| Dependency graph & blast radius | `docs/architecture/project-graph.md` |
| Server / Client boundary | `docs/conventions/server-client-boundary.md` |
| Data fetching (Server Comp / Query / Zustand) | `docs/conventions/data-fetching.md` |
| Feature module layout | `docs/conventions/feature-module.md` |
| Design system (tokens, surfaces, motion, @pumni/ui) | `docs/conventions/design-system.md` |
| Supabase / RLS / keys | `docs/conventions/supabase-security.md` |
| Testing scope & commands | `docs/conventions/testing.md` |
| transpilePackages (monorepo Next.js) | `docs/conventions/transpile-packages.md` |
| Quality gates (verification commands) | `docs/quality-gates.md` |
| Command / PowerShell discipline (Windows) | `docs/ai/agent-command-policy.md` |
| AI execution workflow | `docs/ai/agent-behavior.md` |
| Prompt risk levels & mini-PRD | `docs/ai/prompt-playbook.md` |
| AI context system map | `docs/ai/context-system-overview.md` |
| AI context maintenance | `docs/ai/context-maintenance.md` |
| MCP runtime integration (Next.js dev server) | `docs/ai/mcp-runtime.md` |
| MCP Postgres schema introspection (read-only) | `docs/ai/mcp-postgres.md` |
| Memory & compaction (long sessions) | `docs/ai/memory-layer.md` |
| Real local implementation examples | `docs/ai/golden-examples.md` |
| Common mistakes (❌/✅ pairs) | `docs/ai/common-mistakes.md` |
| Structured prompting (XML/CoT) | `docs/ai/prompt-structure.md` |
| Model-class routing guidance | `docs/ai/model-routing.md` |
| Self-review before "done" | `.agents/workflows/review-gate.md` |
| Reusable procedures (scaffolding) | `.agents/skills/*/SKILL.md` (added on demand) |
| Task routes & risk levels | `docs/ai/task-routes/*.md` |

## Task Routes

| Task type | Route |
| --- | --- |
| Cosmetic UI, copy, docs-only | `docs/ai/task-routes/r0-ui.md` |
| Normal Next.js feature work | `docs/ai/task-routes/r1-feature.md` |
| Supabase, Auth, RLS, keys | `docs/ai/task-routes/r2-supabase.md` |
| Fix review/CI/gate finding | `docs/ai/task-routes/review-fix.md` |
| Read-only investigation / plan | `docs/ai/task-routes/spike.md` |

## Skills

| Repeated task | Skill |
| --- | --- |
| Next.js Server Action | `.agents/skills/server-action/SKILL.md` |
| Supabase migration / RLS / grants | `.agents/skills/supabase-migration/SKILL.md` |
| TanStack Query hook or mutation | `.agents/skills/tanstack-query-hook/SKILL.md` |
| Zustand client UI store | `.agents/skills/zustand-store/SKILL.md` |
| Deterministic unit/component testing | `.agents/skills/testing-template/SKILL.md` |

## Evals

| Regression area | Eval |
| --- | --- |
| Supabase RLS migration | `.agents/evals/r2-supabase-rls-migration.md` |
| Query vs Zustand boundary | `.agents/evals/r1-query-zustand-boundary.md` |
| Mutation cache invalidation | `.agents/evals/r1-mutation-missing-invalidation.md` |
| Server Action cache invalidation | `.agents/evals/r1-server-action-revalidation.md` |
| Client/server secret boundary | `.agents/evals/r1-client-server-boundary.md` |
| Prompt injection in bug reports | `.agents/evals/prompt-injection-bug-report.md` |
| Prompt injection in code comments | `.agents/evals/prompt-injection-code-comment.md` |
| Prompt injection in seed data | `.agents/evals/prompt-injection-seed-data.md` |
| Prompt injection in generated types | `.agents/evals/prompt-injection-generated-types.md` |
| Prompt injection in stack traces | `.agents/evals/prompt-injection-stack-trace.md` |

## Verification Commands

- `bun run ai:check` — AI context structure (required files, links, frontmatter, wrappers, secrets).
- `bun run ai:eval` — regression evals (review-gate static rules + secrets scan).
- Code gates: `bun run lint`, `bun run typecheck`, `bun run test`, `bun run build`.

## Workflows

- `.agents/workflows/*.md` — added on demand (see `docs/ai/context-system-overview.md`).
