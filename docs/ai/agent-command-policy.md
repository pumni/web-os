---
description: Shell rules, harness-tool discipline, and altitude-based validation gates for AI agents.
---

# Agent Command Policy

## Shell & Tools

- **Repo default shell:** PowerShell 7 (`pwsh`). All repo scripts assume `pwsh`.
  If your harness runs on a different shell, use it for simple commands (`git`,
  `bun`, `bunx`) but prefer `bun run <script>` for multi-step work — repo scripts
  are shell-agnostic through `bun`/`turbo` runners.

- **Package manager:** Bun only. `bun run <script>`, `bun install`, `bunx`. The
  `preinstall` hook enforces this.

- **`$env:` / `$null` hazard:** When a harness spawns `pwsh -Command "<string>"`,
  the host shell (cmd, PowerShell 5.1) may pre-evaluate `$` tokens before pwsh
  sees them. Use `pwsh -File` for scripts where this matters; for inline commands,
  avoid `$env:NAME` and `$null` substitutions.

- **File operations:** use harness tools (Grep, Glob, Read, Write, Edit) for
  search/read/write/edit. Shell is for git, compilation, tests, and scripts only.

- **Multi-step repo logic:** lives in `.ps1` scripts under `scripts/`, called via
  `bun run <name>` or `pwsh -File` — not as ad-hoc inline `-Command` chains.
  One-shot inline commands (e.g. `git status && bun run typecheck`) are fine.

## Validation Gates

Run the **narrowest** gate that proves your change — not the full suite by reflex.
If one gate fails, fix it before moving to the next.

| Change Scope | Narrowest Gate | If Green, Optionally |
|---|---|---|
| AI context / docs | `bun run ai:check` | `bun run ai:eval` (security/arch touch) |
| TypeScript-only (types, validators) | `bun run typecheck` | `bun run test` (if logic changed) |
| Feature code (components, actions, hooks) | `bun run lint` && `bun run typecheck` && `bun run test` | `bun run build` |
| Bundle / deploy surface (layout, config, routes) | … then `bun run build` | |
| End-to-end flows | `bunx playwright test` (from `apps/web`) | requires running app + Supabase |

Do not start persistent dev servers unless asked.