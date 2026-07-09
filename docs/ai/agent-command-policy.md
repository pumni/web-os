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
  with your harness's file tools, do not use `cat` / `grep` / `sed` / `find` / `echo`.
  Reserve the shell for git, builds, tests, and running scripts. Harness has no
  file tools? Fall back to `rg` (`rg --files -g '…'` covers `fd`); never `bat` —
  ANSI decoration is transcript noise.
- **Batch independent calls.** If your harness allows parallel tool calls, issue
  independent reads/searches in one turn instead of serially. Only serialize when
  a later call depends on an earlier result.
- **Absolute paths, no `cd`.** Working directory is already the repo root.
- **Read before you edit.** Don't re-read to "verify".
- **Keep output lean.** Cap large output at source (`--quiet`, `| Select-Object -Last N`, fail-only flags).
  Do not paste full build traces, `node_modules` paths, or multi-thousand-line SQL dumps into the transcript — summarize paths + first error.
  Prefer re-running a targeted gate over re-reading megabyte logs.
- **Diagnose failures.** Read errors, fix, then re-run. No sleep-loop polling.
- **Background long commands.** Run builds and watchers in background.
- **Destructive commands need fresh evidence.** Re-check `git status` before reset/delete.
- **Never print secrets.** Reference env vars by name, never echo contents.
- **Regenerate generated files.** Run sync scripts; never hand-edit codegen.

## Minimum path (any harness)

Always: read `AGENTS.md` → `docs/ai/index.md` → only task-relevant rows.
Claude Code: hooks may run `ai:check` on context edits; glob rules auto-load.
Other harnesses (Cursor, Copilot, Codex, …): no hooks/globs/subagents — you must:
1. Load path-relevant `.claude/rules/*` yourself when editing App Router / cache code.
2. Before "done" on code: run the narrowest gate (`typecheck` / `lint` / `test`).
3. Before "done" on context/security/arch touch: `bun run ai:check` and `bun run ai:eval`.
4. High-risk diffs (`supabase/migrations`, `features/watch` sync): follow
   `.agents/workflows/review-gate.md` domain reviewer notes manually if no subagent dispatch.

## Validation Gates

Run the **narrowest** gate that proves your change — not the full suite by
reflex. If a gate fails, fix it before moving to the next.

|Scope|Narrowest Gate|If Green, Optionally|
|---|---|---|
|AI context / docs|`bun run ai:check`|`bun run ai:eval` (security/arch touch)|
|TS-only (types, validators)|`bun run typecheck`|`bun run test` (if logic changed)|
|Feature (comp, action, hook)|`bun run lint` && `typecheck` && `test`|`bun run build`|
|Bundle (layout, config, route)|... then `bun run build`||
|End-to-end flows|`bunx playwright test` (from `apps/web`)|requires running app + Supabase|
|Multi-scope / pre-merge|`bun run ai:premerge` (full ladder)||

> [!NOTE]
> **Advisory & Opt-In Gates:**
> - `bun run ai:metrics` is only used as freeze evidence for context-layer ADR changes; it is NOT part of standard feature Definition of Done.
> - `bun run ai:eval:behavioral` is an opt-in regression test suite; it fails open without API keys and is not required for normal feature completion.

A bug fix starts with a failing test that goes green. Never bypass security or
skip validation; if a command cannot be run, say why.
