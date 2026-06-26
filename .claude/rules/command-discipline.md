---
description: Shell command discipline for Claude Code — PowerShell 7 + repo CLIs only; load whenever editing scripts, app code, or running any shell-bound command.
globs:
  - "scripts/**/*"
  - "apps/**/*.{ts,tsx,js,mjs,ps1}"
  - "packages/**/*.{ts,tsx,js,mjs,ps1}"
  - ".claude/**/*"
---

# Command Discipline — PowerShell 7 + Repo CLIs

Loaded automatically when you open scripts, app code, package code, or any
Claude/agent config. Treat this as the binding shell policy for every shell
call you issue.

## The one rule

**PowerShell 7 (`pwsh`) is the only allowed shell for AI-issued commands.**
Windows PowerShell 5.1, Git Bash, WSL bash, and bare POSIX shells are
prohibited — for any shell-bound work, you must wrap through `pwsh`.

This is not a preference. It is enforced upstream by `AGENTS.md` Command
Discipline and `docs/ai/agent-command-policy.md`. Both call `pwsh 7+` the only
legal shell. The native Bash tool default on Windows is Git Bash; that is the
drift we are closing.

## What to do when Bash sneaks in

| Symptom | Action |
|---|---|
| Tool default is Git Bash / `sh` / `cmd` | Wrap with `pwsh -NoLogo -NoProfile -Command "…"` or refuse the call |
| `&&` / `||` chaining needed | Drop it. Run commands sequentially or with `;` |
| `find`, `findstr`, `grep`, `cat`, `ls -R` in shell | Replace with `fd`, `rg`, `bat --plain --paging=never` |
| Long inline `pwsh -Command "..."` strings | Move the logic into `scripts/*.ps1` and call it |
| `$env:NAME` or `$null` inline | Move assignment into a `.ps1` file |

## Default tool stack

Use these in `pwsh 7` for every read, search, inspection, and validation:

| Task | Tool |
|---|---|
| Find files | `fd` or `rg --files` |
| Search text | `rg -n -C 3 "pattern" <paths>` |
| Read files | `bat --plain --paging=never <path>` |
| Inspect JSON | `jq` |
| Run project scripts | `bun run <script>` |

The native Read/Grep/Glob harness tools are a **fallback only** — invoke them
only when the CLI is missing, there is no shell access, or output is too large
or binary for the terminal. State the reason in one short line when you do.

## Anti-patterns — refuse silently today

- `bash`, `bash -c "…"`, `sh -c "…"`, `cmd /c`, `powershell -Command` (5.1).
- `Bash` tool invocation that is not wrapped in `pwsh -Command "…"`.
- `find`, `findstr`, `cat`, `head -n`, `ls -laR` for repo work — use `fd`, `bat`.
- `grep -R` / `grep --include` for code search — use `rg`.
- Inline `$env:FOO=…` followed by a command on the same line.

## What this rule does NOT cover

- Editing files: use the patch/edit tool. No shell needed.
- Validation: prefer `bun run lint`, `bun run typecheck`, `bun run test`,
  `bun run ai:check`. These already route through `pwsh` per `package.json`.
- Anything marked out-of-scope: see `docs/ai/agent-command-policy.md` for the
  full discipline (chaining, destructive git, validation gates).
