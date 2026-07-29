---
description: Verification markers and load canary matrix for coding agent adapters.
---

# Agent Load Canaries Matrix

This matrix tracks verified entry points, instruction loading behaviors, path-scope capabilities, and fallback actions for supported coding agents.

## Claude Code (#claude-code)

- **Agent / Version**: Claude Code CLI 2026.x
- **Entry File**: `CLAUDE.md` (imports `@AGENTS.md`)
- **Expected Marker**: `[CANARY:CLAUDE_CODE_LOADED]`
- **Nested Behavior**: Native discovery of nested `AGENTS.md` per scope
- **Path-Scope Behavior**: Native `.claude/rules/*.md` path matching
- **Skill Discovery Behavior**: Native `.claude/skills/*/SKILL.md` auto-discovery
- **Last Verified Date**: 2026-07-29
- **Test Result**: PASS
- **Failure Action**: Fallback to direct reading of root `AGENTS.md` and `docs/conventions/*`.

## Codex CLI (#codex-cli)

- **Agent / Version**: OpenAI Codex CLI / AI Agent
- **Entry File**: `AGENTS.md` (Native root entry point)
- **Expected Marker**: `[CANARY:CODEX_AGENTS_MD_LOADED]`
- **Nested Behavior**: Native directory-scoped `AGENTS.md` traversal
- **Path-Scope Behavior**: Evaluated via root `AGENTS.md` navigation map pointers
- **Skill Discovery Behavior**: Manual resolution via `.agents/skills/*/SKILL.md`
- **Last Verified Date**: 2026-07-29
- **Test Result**: PASS
- **Failure Action**: Direct prompt-injection of root `AGENTS.md` invariants.

## GitHub Copilot (#github-copilot)

- **Agent / Version**: GitHub Copilot Extension / Workspace Agent
- **Entry File**: `.github/copilot-instructions.md`
- **Expected Marker**: `[CANARY:COPILOT_INSTRUCTIONS_LOADED]`
- **Nested Behavior**: Manual reference via `.github/copilot-instructions.md` pointers
- **Path-Scope Behavior**: Direct canonical document backlinks
- **Skill Discovery Behavior**: Explicit reference to `.agents/skills/*`
- **Last Verified Date**: 2026-07-29
- **Test Result**: PASS
- **Failure Action**: Fallback to repository root `AGENTS.md`.
