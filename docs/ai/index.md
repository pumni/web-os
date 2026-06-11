# Pumni Web OS — AI Knowledge Index

Canonical owner: `docs/ai/index.md`. Compact lookup table — long-form knowledge lives in the linked files. Start here after `AGENTS.md`.

## Canonical Sources

| Need                                        | Source                                          |
| ------------------------------------------- | ----------------------------------------------- |
| Tool-agnostic project rules                 | `AGENTS.md`                                      |
| Next.js v16 scoped rules                    | `apps/web/AGENTS.md`                             |
| Architecture & package boundaries           | `docs/architecture/overview.md`                  |
| Server / Client boundary                    | `docs/conventions/server-client-boundary.md`     |
| Data fetching (Server Comp / Query / Zustand) | `docs/conventions/data-fetching.md`            |
| Feature module layout                       | `docs/conventions/feature-module.md`             |
| Supabase / RLS / keys                       | `docs/conventions/supabase-security.md`          |
| Testing scope & commands                    | `docs/conventions/testing.md`                    |
| Quality gates (verification commands)       | `docs/quality-gates.md`                          |
| Reusable procedures (scaffolding)           | `.agents/skills/*/SKILL.md` (added on demand)    |
| Task routes & risk levels                   | `docs/ai/task-routes/*.md` (added on demand)     |

## Verification Commands

- `bun run ai:check` — AI context structure (required files, links, frontmatter, wrappers, secrets).
- `bun run ai:eval` — regression evals (review-gate static rules + secrets scan).
- Code gates: `bun run lint`, `bun run typecheck`, `bun run test`, `bun run build`.

## Workflows

- `.agents/workflows/*.md` — added on demand (see `docs/PLAN_ai-context.md` Tier C).
