---
description: Command discipline, agent execution rules, and validation gates.
---

# Agent Command Policy

All AI agents (Claude Code, Codex CLI, Antigravity, etc.) must follow these execution policies to ensure safety, speed, and monorepo consistency.

## 1. Tool-First Execution

Always prioritize native workspace tools over shell commands for file operations. Shell actions bypass built-in safety controls, cause escaping issues, and trigger extra permission prompts.

- **Search/Find:** Use `Grep` (ripgrep-based) and `Glob` tools. Do not run manual `rg` or `find`.
- **Read/Write:** Use native `Read` and `Write` tools to handle binaries and pagination safely.
- **Edits:** Use native `Edit` (exact replacement/patch tools). Avoid `sed` or raw redirection.
- **Shell Commands:** Restrict to `git`, compilation, running tests, or running scripts.

## 2. Shell & Environment Rules

- **PowerShell 7:** `pwsh` is the **only** allowed shell for external execution.
- **Package Manager:** **Bun** is the only manager allowed. Run `bun run <script>`, `bun install`, or `bunx`.
- **Directory Shifts:** Never propose or execute `cd` commands. Set the working directory directly via the execution runner's parameters (e.g., `Cwd` or `workdir`).

## 3. Validation Gates

Run the narrowest validation gate for your changes before declaring a task completed:

| Change Scope | Command |
|---|---|
| AI Context / Docs | `bun run ai:check` |
| Security / Architecture | `bun run ai:eval` |
| TypeScript Only | `bun run typecheck` |
| Feature / Code Changes | `bun run lint + typecheck + test` |
| Full Production Pass | `+ build` |

*E2E Testing: `cd apps/web; bunx playwright test` (requires a running app and Supabase instance). Do not start persistent dev servers unless asked.*

## 4. Enforcement Layers

Policy enforcement logic is centralized in repository scripts, not individual agent tools:

| Layer | Implementation | Responsibility |
|---|---|---|
| Central Logic | `bun run ai:check` / `ai:eval` / `format` | Single source of truth. |
| CI Pipeline | `.github/workflows/{ci,docs-health}.yml` | Authoritative gate for all commits. |
| Local Hook | `.githooks/pre-commit` (opt-in) | Pre-commit validation. |
| Tool Hooks | `.claude/settings.json` integrations | Fast local feedback loops. |

### Claude Code Hooks (Advisory)
- **PostToolUse:** Runs Prettier on edited code/config files (excluding markdown files to prevent layout formatting churn).
- **Stop:** Runs `check-ai-context.mjs` only if context-sensitive files were touched.

## 5. Tool-Specific Runtime Behavior

Ensure command structures and configurations match the target runner's parsing characteristics:

### Claude Code Execution
- **pwsh Integration:** Auto-detects `pwsh` and runs with process-level `-ExecutionPolicy Bypass`.
- **AST Parsing:** Separates compound commands (by `;`, `&`, `|`, `&&`, `||`) and validates permissions for **each** sub-command individually.
- **Rule matching:** Precedence is `deny` -> `ask` -> `allow`. Space boundaries matter: `"PowerShell(git *)"` matches `git status` but not `github`. `"PowerShell(git*)"` matches both.

### Codex CLI Execution
- **Non-Interactive Shell:** Spawns `pwsh -NoLogo -NoProfile -Command "<cmd>"`. Profiles are never loaded.
- **Workspace Sandbox:** Codex isolates actions. The `workspace-write` sandbox mode **blocks network access by default**. For internet-dependent commands (e.g., fetching npm packages), network permissions must be explicitly configured (`sandbox_workspace_write.network_access = true` in config).
