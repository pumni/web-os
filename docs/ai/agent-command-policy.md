---
description: Command discipline and validation gates for the workspace.
---

# Agent Command Policy

PowerShell 7 (`pwsh`) is the only allowed shell for AI-issued commands.
The harness tools (Read/Grep/Glob) handle file operations — no shell needed.
Use `pwsh` for non-file ops: git, npm, bun, `jq`.

## Validation

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

## Enforcement layers (tool-agnostic)

Enforcement is layered so it is **not** owned by any single coding tool. The
logic lives once in `bun` scripts; every surface below just calls them.

| Layer | What | Owns |
|---|---|---|
| Shared logic | `bun run ai:check` / `ai:eval` / `format` | single source of truth |
| Common gate | CI (`.github/workflows/{ci,docs-health}.yml`) | authoritative — every tool's commit passes through it |
| Local common gate | `.githooks/pre-commit` (opt-in: `git config core.hooksPath .githooks`) | same gate, pre-commit, any tool |
| Per-tool adapters | thin, call the shared logic; never hold logic | fast inline feedback |

Per-tool adapters: Claude Code → `.claude/settings.json` hooks
(`.claude/hooks/*.mjs` parse Claude's payload, then delegate to the shared
scripts). Codex / Gemini / Copilot rely on the common gate (CI + pre-commit);
add a thin adapter under each tool's own config if it supports hooks.

Claude Code hooks (fail-open — CI stays authoritative):

- **PostToolUse** → Prettier on the edited file, **code/config only**. Markdown
  is excluded on purpose: `turbo format` never reformats the root context docs,
  and Prettier's table-padding (printWidth 100) inflates the size-budgeted
  files in `scripts/ai-context.manifest.json` for zero semantic gain.
- **Stop** → runs `check-ai-context.mjs` only when the session touched
  AI-context files, turning the advisory gate into enforcement at no cost on
  normal coding sessions.
