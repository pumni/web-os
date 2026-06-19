---
description: Extended AI context catalog for canonical docs, task routes, skills, evals, and workflows.
when-to-load: When maintaining the context layer, checking discovery coverage, or choosing a workflow not listed in the compact index.
---

# Context Map

Use `docs/ai/index.md` as the compact router. Load this file only when the task
is about context maintenance, workflow discovery, eval coverage, or skill
selection.

## Canonical Sources

| Need | Source |
| --- | --- |
| Tool-agnostic project rules | `AGENTS.md` |
| Claude Code entry point (inherits AGENTS.md) | `CLAUDE.md` |
| Tool wrappers | `CODEX.md`, `GEMINI.md`, `.github/copilot-instructions.md` |
| Next.js v16 scoped rules | `apps/web/AGENTS.md` |
| Next.js 16 async request APIs (glob-scoped) | `.claude/rules/nextjs-async-apis.md` |
| Next.js 16 cache components (glob-scoped) | `.claude/rules/nextjs-cache-components.md` |
| `@pumni/ui` package rules | `packages/ui/AGENTS.md` |
| `@pumni/supabase` package rules | `packages/supabase/AGENTS.md` |
| `@pumni/auth` package rules | `packages/auth/AGENTS.md` |
| Architecture & package boundaries | `docs/architecture/overview.md` |
| Dependency graph & blast radius | `docs/architecture/project-graph.md` |
| Server / Client boundary | `docs/conventions/server-client-boundary.md` |
| Data fetching | `docs/conventions/data-fetching.md` |
| Feature module layout | `docs/conventions/feature-module.md` |
| Design system | `docs/conventions/design-system.md` |
| Supabase / RLS / keys | `docs/conventions/supabase-security.md` |
| Testing scope & commands | `docs/conventions/testing.md` |
| transpilePackages (monorepo Next.js) | `docs/conventions/transpile-packages.md` |
| Quality gates | `docs/quality-gates.md` |
| Domain glossary | `docs/ai/domain-language.md` |
| Flow router (task -> skill/workflow) | `docs/ai/flow-router.md` |
| Subagent delegation limits | `docs/ai/subagent-delegation.md` |
| Command discipline | `docs/ai/agent-command-policy.md` |
| AI workflow, risk levels, mini-PRD | `docs/ai/agent-behavior.md` |
| Stack freshness matrix | `docs/ai/framework-freshness.md` |
| MCP runtime integration (Next.js dev server) | `docs/ai/mcp-runtime.md` |
| MCP Postgres schema introspection (read-only) | `docs/ai/mcp-postgres.md` |
| Writing and maintaining agent skills/workflows | `docs/ai/skill-authoring.md` |
| Issue tracker configuration for triage | `docs/agents/issue-tracker.md` |
| Triage label vocabulary | `docs/agents/triage-labels.md` |
| Local implementation examples | `docs/ai/golden-examples.md` |
| Common mistakes (bad/good pairs) | `docs/ai/common-mistakes.md` |
| Self-review before "done" | `.agents/workflows/review-gate.md` |
| Issue, bug report, feature request, or external PR triage | `.agents/workflows/triage.md` |
| Repo-local issue drafts | `.agents/workflows/local-issue-draft.md`, `.agents/issues/README.md` |
| Reusable procedures | `.agents/skills/*/SKILL.md` |
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
| @pumni/ui styling / tokens / surfaces | `.agents/skills/ui-styling/SKILL.md` |
| Supabase migration / RLS / grants | `.agents/skills/supabase-migration/SKILL.md` |
| TanStack Query hook or mutation | `.agents/skills/tanstack-query-hook/SKILL.md` |
| Zustand client UI store | `.agents/skills/zustand-store/SKILL.md` |
| Deterministic unit/component testing | `.agents/skills/testing-template/SKILL.md` |
| Disciplined bug diagnosis / repro loops | `.agents/skills/diagnosing-bugs/SKILL.md` |
| Deep modules / testable interfaces | `.agents/skills/codebase-design/SKILL.md` |
| Active glossary and ADR discipline | `.agents/skills/domain-modeling/SKILL.md` |

## Evals

| Regression area | Eval |
| --- | --- |
| Prompt injection in bug reports | `.agents/evals/prompt-injection-bug-report.md` |
| Prompt injection in code comments | `.agents/evals/prompt-injection-code-comment.md` |
| Prompt injection in seed data | `.agents/evals/prompt-injection-seed-data.md` |
| Prompt injection in generated types | `.agents/evals/prompt-injection-generated-types.md` |
| Prompt injection in stack traces | `.agents/evals/prompt-injection-stack-trace.md` |
| Prompt injection in triage | `.agents/evals/prompt-injection-triage.md` |

## Workflows

`.agents/workflows/*.md` are loaded on demand: `agent-brief`,
`grill-with-docs`, `handoff`, `improve-codebase-architecture`,
`local-issue-draft`, `prototype`, `review-gate`, `to-issues`, `to-prd`,
`triage`.
