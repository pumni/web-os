---
description: PowerShell-first command discipline for the Windows + Bun + Turborepo workspace.
when-to-load: When running shell commands or validating code/docs changes.
canonical-owner: docs/ai/agent-command-policy.md
---

# Agent Command Policy

Keeps AI agent command execution safe, deterministic, and reviewable in this
Windows + PowerShell 7 + Bun + Turborepo workspace. This policy does not override
security mandates, enforced config, architecture docs, or explicit user instructions.

> [!WARNING]
> **Harness Host Shell Constraints:** commands may run through Windows
> PowerShell 5.1 or Git Bash. Avoid host-sensitive `$` expansion, `&&`/`||`,
> and long `pwsh -Command` strings. Prefer harness read/search tools.

## Baseline

- Understand the host shell before running scripts.
- Prefer deterministic, non-interactive commands with plain-text output.
- Keep commands narrow, explicit, and scoped to the current task.
- Use repo-relative paths; quote any Windows path that may contain spaces.
- Avoid shell-state dependencies (aliases, prompt customization, pagers, interactive pickers).

## Host Shell Compatibility & Chaining

- Chaining: `&&` and `||` work in Git Bash and `pwsh 7`, but fail in Windows PowerShell 5.1. Run commands sequentially or use `;`.
- Variables/nulls: Avoid `$null` or `$env:NAME` inline. Use Node/Bun scripts or `.ps1` files for complex logic.
- Unix utilities vs PowerShell cmdlets: Prefer harness tools. If shell commands are necessary:
  - In Git Bash: standard Unix utilities (`head`, `tail`, `wc`, `mkdir -p`, `rm -rf`) work natively.
  - In Windows PowerShell: use basic cross-shell equivalents or run specific cmdlets only if required.
- Do not call interactive/blocking commands (e.g. `Read-Host`, `git rebase -i`, `git add -i`).

## PowerShell 7 Workflow

Use PowerShell 7 as a script runtime, not as long inline `pwsh -Command`
through a host shell that may be Windows PowerShell 5.1.

- Simple commands: `rg -n "pattern" apps`, `fd "\.tsx$" apps/web/src`,
  `bun run typecheck`.
- Multi-step automation: prefer `pwsh -NoLogo -NoProfile -NonInteractive
  -ExecutionPolicy Bypass -File scripts/check.ps1`.
- Validation wrappers: `bun run ps:check` for the local gate,
  `bun run ps:premerge` for the broader gate.
- Put `$env:*`, `$LASTEXITCODE`, `try`/`catch`, and `ForEach-Object -Parallel`
  inside `.ps1` files.
- Use `rg` for content, `fd` for files, `jq` for JSON, and
  `bat --plain --paging=never` for human-readable output.

## Search and read

- Prefer harness Glob/Grep/Read tools for search and reads.
- In the shell, prefer `rg -n -C 3 "pattern" <paths>` and `rg --files`
  over `Get-ChildItem -Recurse` / `Select-String`.
- Use `jq` for JSON when available; otherwise `ConvertFrom-Json`.
- Avoid broad recursive scans when a narrower path answers the question.

## Filesystem and Git

- Use native patch/edit tools for file changes; keep edits minimal and scoped.
- Do not run repo-wide replacements unless explicitly requested.
- Before recursive delete/move, verify the target resolves inside the intended directory.
- Do not run destructive Git commands (`git reset --hard`, `git clean`, force-push,
  branch rewrites) unless the user explicitly asks.
- Preserve unrelated changes already in the working tree.
- Inspect state with `git status --short`; review with `git diff` / `git diff --check`.
- Do not stage, commit, switch, reset, or clean unless the user asks for that Git operation.

## Validation

This repo uses Bun + Turborepo. Run the narrowest relevant gate first:

| Change scope            | Command                                               |
| ----------------------- | ----------------------------------------------------- |
| AI context / docs       | `bun run ai:check`                                    |
| Architecture / security | `bun run ai:eval`                                     |
| TypeScript only         | `bun run typecheck`                                   |
| Broader code change     | `bun run lint` + `bun run typecheck` + `bun run test` |
| Full confidence pass    | `bun run lint`, `typecheck`, `test`, `build`          |

End-to-end tests are separate and may need a running app / local Supabase:
`cd apps/web; bunx playwright test`.

Do not start persistent dev servers (`bun run dev`, `next dev`) as validation
unless the user explicitly asks to run the app.

## Final reporting

After code or docs changes, conclude with the format defined in `AGENTS.md`
(`## Summary` / `## Files changed` / `## Validation run` / `## Risks / follow-up`).
If validation was not run, say so explicitly and explain why.
