---
description: PowerShell-first command discipline for the Windows + Bun + Turborepo workspace.
when-to-load: When running shell commands or validating code/docs changes.
canonical-owner: docs/ai/agent-command-policy.md
---

# Agent Command Policy

Keeps AI agent command execution safe, deterministic, and reviewable in this
Windows + PowerShell 7 + Bun + Turborepo workspace. This policy does not override
security mandates, enforced config, architecture docs, or explicit user instructions.

## Baseline

- Use PowerShell 7 (`pwsh`) on Windows by default. Use `cmd.exe`, Bash, or WSL only
  when a task explicitly requires that environment.
- Prefer deterministic, non-interactive commands with plain-text output.
- Keep commands narrow, explicit, and scoped to the current task.
- Use repo-relative paths; quote any Windows path that may contain spaces.
- Avoid shell-state dependencies (aliases, prompt customization, pagers, interactive pickers).
- Check optional tools first: `Get-Command <tool> -ErrorAction SilentlyContinue`.

## PowerShell 7 syntax (this is pwsh, not bash)

- Pipeline chaining works: `cmd1 && cmd2`, `cmd1 || cmd2`. Prefer `&&` when the
  second command should only run on success.
- Null handling: `$null` (not `/dev/null`); redirect with `2>$null`.
- Env vars: read `$env:NAME`, set `$env:NAME = "value"` (no inline `VAR=x cmd` prefix).
- Line continuation is the backtick `` ` ``, not `\`.
- Unix commands that do NOT exist in pwsh — use the equivalent:
  - `head`/`tail` -> `Get-Content f -TotalCount N` / `-Tail N`, or `| Select-Object -First/-Last N`
  - `which` -> `(Get-Command name).Source`
  - `wc -l` -> `(Get-Content f | Measure-Object -Line).Lines`
  - `mkdir -p` -> `New-Item -ItemType Directory -Force <path>`
  - `rm -rf` -> `Remove-Item -Recurse -Force <path>`
- Do not call interactive/blocking commands (`Read-Host`, `Get-Credential`,
  `Out-GridView`, `git rebase -i`, `git add -i`).

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

| Change scope            | Command                                              |
| ----------------------- | ---------------------------------------------------- |
| AI context / docs       | `bun run ai:check`                                   |
| Architecture / security | `bun run ai:eval`                                    |
| TypeScript only         | `bun run typecheck`                                  |
| Broader code change     | `bun run lint` + `bun run typecheck` + `bun run test` |
| Full confidence pass    | `bun run lint`, `typecheck`, `test`, `build`         |

End-to-end tests are separate and may need a running app / local Supabase:
`cd apps/web; bunx playwright test`.

Do not start persistent dev servers (`bun run dev`, `next dev`) as validation
unless the user explicitly asks to run the app.

## Final reporting

After code or docs changes, conclude with the format defined in `AGENTS.md`
(`## Summary` / `## Files changed` / `## Validation run` / `## Risks / follow-up`).
If validation was not run, say so explicitly and explain why.
