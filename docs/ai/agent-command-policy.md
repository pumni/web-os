---
description: Command discipline and validation gates for the workspace.
---

# Agent Command Policy

PowerShell 7 (`pwsh`) is the only allowed shell for AI-issued commands.
The harness tools (Read/Grep/Glob) handle file operations — no shell needed.
Use `pwsh` for non-file ops: git, npm, bun, `jq`.

## Validation (altitude table)

Run the narrowest gate for your change scope:

| Change scope | Command |
|---|---|
| AI context / docs | `bun run ai:check` |
| Architecture / security | `bun run ai:eval` |
| TypeScript only | `bun run typecheck` |
| Broader code change | `bun run lint + typecheck + test` |
| Full confidence pass | `+ build` |

E2E: `cd apps/web; bunx playwright test` (needs running app/Supabase).
Do not start persistent dev servers unless explicitly asked.
