---
description: Shell rules, harness-tool discipline, and altitude-based validation gates for AI agents (Claude Code, Codex, opencode, and any tool-calling harness).
---

# Agent Command Policy

Tool-agnostic. "Harness" = whatever agent runtime you run in (Claude Code,
Codex, opencode, …) — map capability-dependent rules to your own tool names.

## Build System vs. Shell

Keep these two separate:

- **Build system = Bun + Turbo.** All repo automation is JavaScript run through
  Bun: scripts live in `scripts/*.mjs` and are invoked via `bun run <name>`
  (see `package.json`). These are **shell-agnostic** — they behave the same
  regardless of which shell your harness spawns. There are **no `.ps1` repo
  scripts**; do not author or expect any.
- **Shell = where you type commands.** On the canonical Windows dev box that is
  PowerShell 7 (`pwsh`). It is only the command entry point, **not** where repo
  logic lives.

### Package manager: Bun only

`bun run <script>`, `bun install`, `bunx`. Never `npm`/`pnpm`/`yarn` — the
`preinstall` hook (`bunx only-allow bun`) will reject them.

### Shell portability

- Prefer `bun run <script>` for anything multi-step; it works identically across
  shells, so your commands stay portable between harnesses.
- Use the shell directly only for simple, portable commands (`git`, `bun`,
  `bunx`, `bunx playwright test`).
- New multi-step repo logic belongs in a `scripts/*.mjs` file wired into
  `package.json`, **not** in ad-hoc inline command chains. One-shot chains
  (`git status && bun run typecheck`) are fine.

### PowerShell `$env:` / `$null` hazard

When a harness spawns `pwsh -Command "<string>"`, an outer host (cmd or
PowerShell 5.1) may pre-evaluate `$` tokens before `pwsh` sees them. If you must
run a PowerShell script with such tokens, invoke it via `pwsh -File`; for inline
commands avoid `$env:NAME` / `$null` (`bun run` scripts are unaffected).

## Tool Discipline

Favor structured tools over raw shell — results stay parseable and auditable.

- **Use dedicated tools over shell equivalents.** Read/search/edit/write files
  with your harness's file tools, not `cat` / `grep` / `sed` / `find` / `echo >`.
  Reserve the shell for git, builds, tests, and running scripts. Harness has no
  file tools? Fall back to `rg` (`rg --files -g '…'` covers `fd`); never `bat` —
  ANSI decoration is transcript noise.
- **Batch independent calls.** If your harness allows parallel tool calls, issue
  independent reads/searches in one turn instead of serially. Only serialize when
  a later call depends on an earlier result.
- **Absolute paths, no `cd` prefix.** The working directory is already the repo
  root; prefixing commands with `cd` can trigger permission prompts and breaks
  portability.
- **Read before you edit; don't re-read to "verify".** Edits fail loudly if the
  target text is stale, so a post-edit re-read is wasted work.
- **Keep output lean.** Cap command output at the source (targeted paths,
  `--quiet` flags, `| tail`) — log-bloated transcripts decay
  instruction-following.
- **Diagnose failures; don't blind-retry.** Read the error, fix the cause, then
  re-run. No sleep-loop polling — run long waits in the background.
- **Long-lived commands go to the background.** Builds, watchers, and test
  servers should run in the background if your harness supports it; otherwise cap
  the timeout. **Do not start persistent dev servers unless asked.**
- **Destructive commands need fresh evidence.** Before `git reset --hard`,
  `git checkout -- <path>`, or bulk deletes, re-check `git status` and prefer
  the recoverable alternative (`git stash`) when in doubt.
- **Never print secret values.** Reference env vars by name, never echo their
  contents — the transcript is a log outside the `ai:secrets` scan.
- **Treat generated files as read-only inputs** — regenerate, never hand-edit:
  `bun run ai:skills:sync` (skill shims), `ai:graph:sync` (project graph),
  `ai:adr:sync` (ADR register), package codegen for
  `packages/supabase/src/types.ts`.

## Validation Gates

Run the **narrowest** gate that proves your change — not the full suite by
reflex. If a gate fails, fix it before moving to the next.

| Change Scope | Narrowest Gate | If Green, Optionally |
|---|---|---|
| AI context / docs | `bun run ai:check` | `bun run ai:eval` (security/arch touch) |
| TypeScript-only (types, validators) | `bun run typecheck` | `bun run test` (if logic changed) |
| Feature code (components, actions, hooks) | `bun run lint` && `bun run typecheck` && `bun run test` | `bun run build` |
| Bundle / deploy surface (layout, config, routes) | … then `bun run build` | |
| End-to-end flows | `bunx playwright test` (from `apps/web`) | requires running app + Supabase |
| Multi-scope / pre-merge handoff | `bun run ai:premerge` (full ladder, one command) | |

A bug fix starts with a failing test that goes green. Never bypass security or
skip validation; if a command cannot be run, say why.
