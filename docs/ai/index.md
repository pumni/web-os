# Pumni Web OS — AI Knowledge Index

Canonical owner: `docs/ai/index.md`. Keep this file as the compact router after
`AGENTS.md`; load `docs/ai/context-map.md` only when maintaining or auditing the
context system itself.

## Start Here

| Need | Load |
| --- | --- |
| Session startup / any shell command | `docs/ai/agent-command-policy.md` |
| Task routing / risk level | `docs/ai/agent-behavior.md`, then the matching `docs/ai/task-routes/*.md` |
| Route, skill, or workflow selection | `docs/ai/flow-router.md` |
| Stack/API freshness | `docs/ai/framework-freshness.md` |
| Full context catalog | `docs/ai/context-map.md` |
| Local implementation examples | `docs/ai/golden-examples.md` |
| Known bad/good patterns | `docs/ai/common-mistakes.md` |

## Task Routes

| Task type | Route |
| --- | --- |
| Cosmetic UI, copy, docs-only | `docs/ai/task-routes/r0-ui.md` |
| Normal Next.js feature work | `docs/ai/task-routes/r1-feature.md` |
| Supabase, Auth, RLS, keys | `docs/ai/task-routes/r2-supabase.md` |
| Fix review/CI/gate finding | `docs/ai/task-routes/review-fix.md` |
| Read-only investigation / plan | `docs/ai/task-routes/spike.md` |

## Verification Commands

- `bun run ai:check` — AI context structure (required files, links, frontmatter, wrappers, secrets).
- `bun run ai:eval` — regression evals (review-gate static rules + secrets scan).
- `bun run ai:eval:behavioral` — agent-backed prompt-injection behavior evals.
- `bun run ai:eval:behavioral:stub` — deterministic local behavioral smoke.
- Code gates: `bun run lint`, `bun run typecheck`, `bun run test`, `bun run build`.

## Extended Catalog

For the full list of canonical docs, package AGENTS files, skills, workflows,
and evals, load `docs/ai/context-map.md`.
