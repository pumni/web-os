# Agent Context Layer Baseline — July 2026

> Historical — not current guidance. This baseline describes the pre-remediation
> context layer and is retained for audit history only.

## 1. Overview & Baseline Execution Status

Baseline executed on branch `refactor/agent-context-2026-07`.

| Gate / Check Command | Status | Notes |
|---|---|---|
| `bun run ai:check` | PASS | `check-ai-context.mjs`, `sync-claude-shims.mjs --check`, `sync-project-graph.mjs`, `sync-adr-register.mjs`, `sync-nav-table.mjs` passed cleanly. |
| `bun run ai:eval` | PASS | Static review rules (24/24 rule types self-tested, 354 code / 25 SQL files scanned), secrets scan, feature-boundary check passed. |
| `bun scripts/check-ai-context.mjs --self-test` | PASS | Table validation, Claude shims, and encoding hygiene checks passed. |

---

## 2. Artefact Inventory

### 2.1. Instruction Authority (`AGENTS.md` Files)

Total count: 10 files

- `AGENTS.md` (Root)
- `apps/web/AGENTS.md`
- `apps/catalog/AGENTS.md`
- `packages/auth/AGENTS.md`
- `packages/config/AGENTS.md`
- `packages/env/AGENTS.md`
- `packages/supabase/AGENTS.md`
- `packages/test-utils/AGENTS.md`
- `packages/ui/AGENTS.md`
- `packages/validators/AGENTS.md`

### 2.2. Active Skills

Total active canonical skills under `.agents/skills/`: 19 skills

- `codebase-design`
- `context-health`
- `dependency-update`
- `diagnosing-bugs`
- `domain-modeling`
- `feature-module`
- `grill-requirements`
- `react-hook-form`
- `refactor-plan`
- `review-gate`
- `server-action`
- `server-component-read`
- `supabase-migration`
- `tanstack-query-hook`
- `testing-template`
- `ui-styling`
- `watch-sync`
- `zod-validator`
- `zustand-store`

### 2.3. Adapters & Auto-Loaded Context

#### Always-Loaded Files & Estimated Sizes
- `AGENTS.md`: 10,619 bytes (~2,655 tokens)
- `CLAUDE.md`: 11 bytes (~3 tokens)
- `.github/copilot-instructions.md`: 395 bytes (~99 tokens)
- `.claude/rules/supabase-migrations.md`: 574 bytes (~144 tokens)
- `.claude/rules/nextjs-cache-components.md`: 944 bytes (~236 tokens)
- `.claude/rules/nextjs-async-apis.md`: 716 bytes (~179 tokens)

Total startup/always-loaded estimated tokens for Claude Code: ~3,217 tokens.

#### Cross-Tool & Adapter Coupling Findings
- `.github/copilot-instructions.md` points directly to `.claude/rules/*.md`.

### 2.4. MCP Servers (`.mcp.json`)

- `next-devtools`: launcher is `npx` (runs `next-devtools-mcp@0.4.0`). Note: contradiction with root Bun-only rule.

### 2.5. Context Hooks & Developer Automation (`.claude/settings.json`)

- `SessionStart`: `bun .claude/hooks/context-drift-notice.mjs`
- `PostToolUse`: `bun .claude/hooks/format-edited-file.mjs` (Prettier formatting mixed in context settings)
- `Stop`: `bun .claude/hooks/ai-context-stop-gate.mjs`

### 2.6. Context Scripts & Registries

- Flat map: `scripts/context-map.json`
- Quality/integrity manifest: `scripts/ai-context.manifest.json`
- Verification & sync scripts:
  - `scripts/check-ai-context.mjs`
  - `scripts/sync-nav-table.mjs`
  - `scripts/sync-skills.mjs`
  - `scripts/sync-claude-shims.mjs`
  - `scripts/run-ai-evals.mjs` (static review gate)
  - `scripts/review-gate-rules.mjs`
  - `scripts/check-secrets.mjs`
  - `scripts/sync-project-graph.mjs`
  - `scripts/sync-adr-register.mjs`
