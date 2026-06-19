---
description: PowerShell-first command discipline for the Windows + Bun + Turborepo workspace.
when-to-load: Immediately after docs/ai/index.md during session startup, before any shell command.
canonical-owner: docs/ai/agent-command-policy.md
---

# Agent Command Policy

Keeps AI command execution safe, deterministic, and reviewable in this Windows +
Bun + Turborepo workspace. This policy does not override higher-priority rules.

> [!WARNING]
> **Host Shell Constraints:** commands may run through Windows PowerShell 5.1 or
> Git Bash. Avoid host-sensitive `$` expansion, `&&`/`||`, and long
> `pwsh -Command` strings.

## Baseline

- Understand the host shell before running scripts.
- Prefer deterministic, non-interactive commands with plain-text output.
- Keep commands narrow, explicit, and scoped to the current task.
- Use repo-relative paths; quote Windows paths with spaces.
- Avoid aliases, pagers, prompt state, and interactive pickers.

## Host Shell Compatibility & Chaining

- Chaining: `&&` and `||` fail in Windows PowerShell 5.1. Run commands
  sequentially or use `;`.
- Variables/nulls: Avoid `$null` or `$env:NAME` inline. Use Bun/Node scripts or
  `.ps1` files for complex logic.
- Prefer the CLI tools below. Use shell-native commands only when needed.
- Do not call interactive/blocking commands (e.g. `Read-Host`, `git rebase -i`, `git add -i`).

## CLI Preference Order

Use this order for reads, search, inspection, and validation:

1. Repo-preferred CLIs: `rg`, `fd`, `bat`, and `jq`.
2. Native harness read/search tools when they are cleaner or shell access is
   limited.
3. Narrow shell-native fallbacks only when the preferred CLI is unavailable or
   unsuitable.

Do not default to broad PowerShell recursion when `rg` or `fd` can answer the
question. If a preferred CLI is unavailable, use the narrowest fallback and say
why when it affects the work.

| Task | Prefer | Avoid unless needed |
| --- | --- | --- |
| Find files | `fd`, `rg --files`; harness Glob when cleaner | `Get-ChildItem -Recurse`, `dir /s` |
| Search text | `rg -n -C 3 "pattern" <paths>`; harness Grep when cleaner | `Select-String`, `findstr`, broad recursive scans |
| Read files | `bat --plain --paging=never <path>`; harness Read when cleaner | pagers, noisy shell output |
| Inspect JSON | `jq` | regex/string parsing JSON |
| Run project scripts | `bun run <script>` | manually reproducing script internals |

## PowerShell 7 Workflow

Use PowerShell 7 as a script runtime, not as long inline `pwsh -Command`.

- Simple commands: `rg -n "pattern" apps`, `fd "\.tsx$" apps/web/src`.
- Multi-step automation: prefer `pwsh -NoLogo -NoProfile -NonInteractive
  -ExecutionPolicy Bypass -File scripts/check.ps1`.
- Validation wrappers: `bun run ps:check` for the local gate,
  `bun run ps:premerge` for the broader gate.
- Put `$env:*`, `$LASTEXITCODE`, `try`/`catch`, and `ForEach-Object -Parallel`
  inside `.ps1` files.

## Search and read

- Prefer `rg -n -C 3 "pattern" <paths>`, `rg --files`, `fd`,
  `bat --plain --paging=never`, and `jq`.
- Use native harness Glob/Grep/Read tools when they are cleaner or shell access
  is limited.
- Use `Get-Content` or `ConvertFrom-Json` only when simpler or when preferred
  tools are unavailable.
- Avoid broad recursive scans when a narrower path answers the question.

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

After code or docs changes, use the final format in `AGENTS.md`. If validation
was not run, say why.
