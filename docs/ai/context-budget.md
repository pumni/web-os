---
description: Scenario-based token load estimates, pruning criteria, and per-harness startup context metrics.
---

# Agent Context Token & Load Budget Report

This document specifies scenario-based startup, path-scoped, and skill token estimates for supported coding agent harnesses.

> [!NOTE]
> Token counts in this report are scenario-based approximations estimated using the standard 4 characters per token heuristic.

## Token Load Summary (Scenario-Based Estimate)

| Harness | Entry Point | Always-Loaded Tokens | Scoped Instruction Tokens | Skill Metadata Tokens | Sample Activated Skill Tokens | Total Estimated Scenario Tokens |
|---|---|---|---|---|---|---|
| **Claude Code** | `CLAUDE.md` (`@AGENTS.md`) | ~3 | ~559 | ~1,045 | ~2,150 | ~3,757 |
| **Codex CLI** | `AGENTS.md` | ~2,689 | 0 | ~1,045 | ~2,150 | ~5,884 |
| **GitHub Copilot** | `.github/copilot-instructions.md` | ~99 | 0 | ~1,045 | ~2,150 | ~3,294 |

---

## Pruning Criteria & Discipline

Every sentence or instruction in the context layer must satisfy all 6 pruning questions:

1. **Failure Prevention**: What historical or concrete failure mode does this rule prevent?
2. **Canonical Evidence**: Where is the executable evidence or canonical source doc located?
3. **Scope Specificity**: Which specific directory or file scope does this rule apply to?
4. **Native Harness Baseline**: Has the native coding agent harness already implemented this default capability?
5. **Progressive Disclosure**: Can this rule be moved from always-loaded context to path-scoped or on-demand skill context?
6. **Review Schedule**: When is this instruction scheduled for review or removal?

---

## Hard Size Budgets (`scripts/ai-context.manifest.json`)

- `AGENTS.md`: max 12,500 bytes
- `docs/ai/MEMORY.md`: max 2,300 bytes
- `docs/ai/common-mistakes.md`: max 4,600 bytes
- `.agents/skills/review-gate/SKILL.md`: max 3,300 bytes
- `docs/ai/mcp.md`: max 3,300 bytes
