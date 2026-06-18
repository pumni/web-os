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
> **Harness Host Shell Constraints:** AI agents execute shell commands via the harness's host environment (which varies between Windows PowerShell 5.1 and Git Bash).
> - **Pre-evaluation & Stripping:** Variables/symbols (like `$`, e.g. `$env:NAME`, `$null`) are pre-evaluated or stripped by the host shell before the command is run, or when calling a sub-process like `pwsh -Command`.
> - **Operator Support:** Operators like `&&` are not supported in Windows PowerShell 5.1 and will cause parser errors.
> - **Best Practice:** Prefer using harness tools (`view_file`, `grep_search`, `list_dir`) over shell commands to read or search the repository.

## Baseline

- Understand the host shell (Windows PowerShell 5.1, Git Bash) before running scripts.
- Prefer deterministic, non-interactive commands with plain-text output.
- Keep commands narrow, explicit, and scoped to the current task.
- Use repo-relative paths; quote any Windows path that may contain spaces.
- Avoid shell-state dependencies (aliases, prompt customization, pagers, interactive pickers).

## Host Shell Compatibility & Chaining

- Chaining commands: `&&` and `||` work in Git Bash and `pwsh 7`, but cause parser errors in Windows PowerShell 5.1. For safety across platforms, run commands sequentially or use `;` as a separator.
- Variable/Null handling: Avoid using `$null` or `$env:NAME` in shell commands unless absolutely necessary. The host shell may pre-evaluate or strip the `$` character, causing failures. Instead, use cross-shell Node/Bun scripts to manage complex logic or environments.
- Unix utilities vs PowerShell cmdlets: Prefer harness tools. If shell commands are necessary:
  - In Git Bash: standard Unix utilities (`head`, `tail`, `wc`, `mkdir -p`, `rm -rf`) work natively.
  - In Windows PowerShell: use basic cross-shell equivalents or run specific cmdlets only if required.
- Do not call interactive/blocking commands (e.g. `Read-Host`, `git rebase -i`, `git add -i`).

## Search and read

- Prefer the harness Glob/Grep/Read tools for file search, content search, and reads.
- In the shell, prefer `rg -n -C 3 "pattern" <paths>` and `rg --files` (if available)
  over `Get-ChildItem -Recurse` / `Select-String` for speed.
- Use `jq` for JSON when available; otherwise `ConvertFrom-Json`.
- Avoid broad recursive scans when a narrower path answers the question.

## Filesystem and Git

- Use native patch/edit tools for file changes; keep edits minimal and scoped.
- Do not run repo-wide replacements unless explicitly requested.
- Before any recursive delete/move, verify the target resolves inside the intended directory.
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
