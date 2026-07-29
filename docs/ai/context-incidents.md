---
description: Context Incident Log tracking agent context failures, stale guidance, adapter mismatches, and token/latency regressions.
---

# Context Incident Log

This document records incidents where context layer rules, adapters, or gates failed, drifted, or caused token/latency regressions. Every incident must reach one of three outcomes: `fix`, `accept`, or `remove guidance`.

## Incident Log

### INC-2026-07-01: Priority Stack Lowers Direct User Intent

- **Date**: 2026-07-29
- **Type**: Stale guidance / Authority misconfiguration
- **Description**: Root `AGENTS.md` placed user task intent at P6, lower than docs and skills.
- **Traceable Cause**: Legacy priority stack conflated authority precedence with evidence reliability.
- **Outcome**: `fix`
- **Resolution**: Refactored authority precedence in `AGENTS.md` so user intent is placed above repository docs/skills.

### INC-2026-07-02: Copilot Adapter Cross-Tool Coupling

- **Date**: 2026-07-29
- **Type**: Adapter mismatch
- **Description**: `.github/copilot-instructions.md` referenced `.claude/rules/*.md`.
- **Traceable Cause**: Legacy shortcut pointing non-Claude agent to Claude-specific rule adapter.
- **Outcome**: `fix`
- **Resolution**: Pointed Copilot adapter directly to canonical docs and skills.

### INC-2026-07-03: Bun-only Policy Contradiction in `.mcp.json`

- **Date**: 2026-07-29
- **Type**: Enforcement contradiction
- **Description**: Root `AGENTS.md` banned non-bun package runners, but `.mcp.json` used legacy runner to launch `next-devtools-mcp`.
- **Traceable Cause**: MCP configuration introduced non-bun launcher without setting bunx exception.
- **Outcome**: `fix`
- **Resolution**: Migrated `.mcp.json` launcher to `bunx`.
