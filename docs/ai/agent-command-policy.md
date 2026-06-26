---
description: PowerShell-first command discipline for the Windows + Bun + Turborepo workspace. Use when running shell commands or validating code/docs changes.
canonical-owner: docs/ai/agent-command-policy.md
---

# Agent Command Policy

Keeps AI command execution safe, deterministic, and reviewable in this Windows +
Bun + Turborepo workspace. This policy does not override higher-priority rules.

> [!CAUTION]
> **PowerShell 7 (`pwsh`) is the only allowed shell for AI-issued commands.**
> Windows PowerShell 5.1, Git Bash, WSL bash, and bare POSIX shells are
> prohibited. Any shell-bound run must go through `pwsh`. `bash`, `sh`,
> `cmd`, `bash -c`, and unprefixed tool defaults all count as drift — fix the
> command, do not justify the shell.

## Baseline

- Understand the host shell before running scripts.
- Prefer deterministic, non-interactive commands with plain-text output.
- Keep commands narrow, explicit, and scoped to the current task.
- Use repo-relative paths; quote Windows paths with spaces.
- Avoid aliases, pagers, prompt state, and interactive pickers.

## Host Shell Compatibility & Chaining

- **Shell: `pwsh` 7+.** Anything else is a violation. If a tool default falls
  back to Bash, wrap it (`pwsh -NoLogo -NoProfile -Command "..."`) or refuse
  the tool call — never let the bash form execute.
- Chaining: `&&` and `||` are unreliable across shells. Run commands
  sequentially or use `;`.
- Variables/nulls: Avoid `$null` or `$env:NAME` inline. Use Bun/Node scripts or
  `.ps1` files for complex logic.
- Prefer the CLI tools below. Use shell-native commands only when needed.
- Do not call interactive/blocking commands (e.g. `Read-Host`, `git rebase -i`, `git add -i`).

## CLI Preference Order

**Default to PowerShell 7 + the repo CLIs** for every read, search, inspection,
and validation. The AI's native harness tools (Read/Grep/Glob) are a **fallback
only** — use them when a CLI genuinely cannot do the job: the CLI is missing,
there is no shell access, or the output is too large/binary for the terminal.
Say why when you fall back and it affects the work.

1. **First — repo CLIs in PowerShell 7:** `rg`, `fd`, `bat --plain --paging=never`, `jq`.
2. **Fallback — native harness tools** only when (1) is unavailable or unsuitable.
3. **Last — narrow shell-native commands** when neither fits.

Do not default to broad recursion (`Get-ChildItem -Recurse`, `Select-String`,
`findstr`) when `rg`/`fd` answer the question.

| Task                | Use first (PowerShell 7)            | Fallback (only if CLI can't) |
| ------------------- | ----------------------------------- | ---------------------------- |
| Find files          | `fd`, `rg --files`                  | harness Glob                 |
| Search text         | `rg -n -C 3 "pattern" <paths>`      | harness Grep                 |
| Read files          | `bat --plain --paging=never <path>` | harness Read                 |
| Inspect JSON        | `jq`                                | —                            |
| Run project scripts | `bun run <script>`                  | —                            |

## PowerShell 7 Workflow

Use PowerShell 7 as a script runtime, not as long inline `pwsh -Command`.

- Simple commands: `rg -n "pattern" apps`, `fd "\.tsx$" apps/web/src`.
- Multi-step automation: prefer `pwsh -NoLogo -NoProfile -NonInteractive
-ExecutionPolicy Bypass -File scripts/check.ps1`.
- Validation wrappers: `bun run ps:check` for the local gate,
  `bun run ps:premerge` for the broader gate.
- Put `$env:*`, `$LASTEXITCODE`, `try`/`catch`, and `ForEach-Object -Parallel`
  inside `.ps1` files.

## Filesystem and Git

- Use native patch/edit tools; keep edits minimal and scoped.
- Do not run repo-wide replacements unless explicitly requested.
- Before recursive delete/move, verify the resolved target.
- Do not run destructive Git commands (`git reset --hard`, `git clean`, force-push,
  branch rewrites) unless the user explicitly asks.
- Preserve unrelated changes already in the working tree.
- Inspect state with `git status --short`; review with `git diff` / `git diff --check`.
- Do not stage, commit, switch, reset, or clean unless the user asks for that Git operation.

## Validation

Run the narrowest relevant gate first:

| Change scope            | Command                                               |
| ----------------------- | ----------------------------------------------------- |
| AI context / docs       | `bun run ai:check`                                    |
| Architecture / security | `bun run ai:eval`                                     |
| TypeScript only         | `bun run typecheck`                                   |
| Broader code change     | `bun run lint` + `bun run typecheck` + `bun run test` |
| Full confidence pass    | `bun run lint`, `typecheck`, `test`, `build`          |

E2E is separate and may need a running app/local Supabase:
`cd apps/web; bunx playwright test`.

Do not start persistent dev servers (`bun run dev`, `next dev`) as validation
unless the user explicitly asks to run the app.

## Final reporting

After code or docs changes, report what changed, which files, and which
validation gates you ran (and their result). If validation was not run, say why.
