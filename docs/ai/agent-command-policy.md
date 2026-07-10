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

- Prefer `bun run <script>` for multi-step tasks to stay portable.
- Use the shell directly only for simple commands (`git`, `bun`, `bunx playwright test`).
- New multi-step logic belongs in `scripts/*.mjs` wired into `package.json`, not in ad-hoc inline chains. One-shot chains (`git status && bun run typecheck`) are fine.

### PowerShell `$env:` / `$null` hazard

Outer hosts (cmd/PS 5.1) may pre-evaluate `$` tokens when invoking `pwsh -Command "<string>"`. To avoid this, use `pwsh -File` or run via `bun run` scripts; avoid inline `$env:NAME` or `$null` tokens.

## Tool Discipline

Favor structured tools over raw shell to keep transcripts parseable.

- **Use harness file tools over shell** (`cat`/`grep`/`sed`/`find`/`echo`). Reserve shell for git, builds, tests, and running scripts. Fall back to `rg` if no file tools exist; avoid `bat` (ANSI noise).
- **Batch independent calls.** Issue parallel reads/searches in one turn if the harness supports it.
- **Absolute paths, no `cd`.** Working directory is already the repo root.
- **Read before you edit.** Don't re-read to "verify".
- **Keep output lean.** Cap output at source (`--quiet`, `| Select-Object -Last N`). Summarize errors and paths; do not dump massive build/SQL traces. Prefer targeted gates over giant logs.
- **Diagnose failures.** Read errors, fix, then re-run. No sleep-loop polling.
- **Background long commands.** Run builds and watchers in background.
- **Destructive commands need fresh evidence.** Re-check `git status` before reset/delete.
- **Never print secrets.** Reference env vars by name, never echo contents.
- **Regenerate generated files.** Run sync scripts; never hand-edit codegen.

## Minimum path (any harness)

Always read `AGENTS.md` → `docs/ai/index.md` → only task-relevant rows.
- **Claude Code**: Hooks run `ai:check` on context edits; rules auto-load.
- **Other harnesses**: Manually load rules in `.claude/rules/`. Before done, run the narrowest gate (below); for context/security/arch touch, run `bun run ai:check` and `ai:eval`; follow `review-gate.md` for high-risk migrations/sync.

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
