---
description: Aggregate token load budgets, pruning criteria, and per-harness startup context metrics.
---

# Agent Context Token & Load Budget Report

This document specifies aggregate startup, path-scoped, and skill token budgets for supported coding agent harnesses.

## Token Load Summary (Post-Refactor Baseline)

| Harness | Entry Point | Always-Loaded Startup Tokens | Path-Scoped Rule Tokens | Skill Catalog (On-Demand) | Startup File Count |
|---|---|---|---|---|---|
| **Claude Code** | `CLAUDE.md` (`@AGENTS.md`) | ~2,689 | ~559 | ~19,795 | 4 |
| **Codex CLI** | `AGENTS.md` | ~2,689 | 0 (Manual) | ~19,795 | 1 |
| **GitHub Copilot** | `.github/copilot-instructions.md` | ~2,689 | 0 (Manual) | ~19,795 | 1 |

---

## Pruning Criteria & Discipline

Every sentence or instruction in the context layer must satisfy all 6 pruning questions:

1. **Failure Prevention**: What historical or concrete failure mode does this rule prevent?
2. **Canonical Evidence**: Where is the executable evidence or canonical source doc located?
3. **Scope Specificity**: Which specific directory or file scope does this rule apply to?
4. **Native Harness Baseline**: Has the native coding agent harness already implemented this default capability?
5. **Progressive Disclosure**: Can this rule be moved from always-loaded context to path-scoped or on-demand skill context?
6. **Review Schedule**: When is this instruction scheduled for review or removal?

Instructions that fail to satisfy these questions are pruned or demoted to reference files.

---

## Size & Token Budgets (`scripts/ai-context.manifest.json`)

- `AGENTS.md`: max 12,500 bytes (~3,125 tokens)
- `docs/ai/MEMORY.md`: max 2,300 bytes (~575 tokens)
- `docs/ai/common-mistakes.md`: max 4,600 bytes (~1,150 tokens)
- `.agents/skills/review-gate/SKILL.md`: max 3,300 bytes (~825 tokens)
- `docs/ai/mcp.md`: max 3,300 bytes (~825 tokens)
