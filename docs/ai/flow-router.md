---
description: Quick router from task situation to the AI route, skill, or workflow to use.
when-to-load: When choosing how to handle a task, especially when it could be bug diagnosis, planning, prototype, handoff, or architecture work.
---

# Flow Router

| Situation | Use |
| --- | --- |
| Bug, failing test, thrown error, flake, or performance regression | `.agents/skills/diagnosing-bugs/SKILL.md` |
| Ambiguous feature or design with unresolved product choices | `.agents/workflows/grill-with-docs.md` |
| Multi-session feature or substantial planning output | `.agents/workflows/to-prd.md`, then `.agents/workflows/to-issues.md` |
| Request or issue needs an AFK-ready implementation brief | `.agents/workflows/agent-brief.md` |
| Fresh session needs the current work summarized | `.agents/workflows/handoff.md` |
| UI/state/business-rule question needs a runnable answer | `.agents/workflows/prototype.md` |
| Module shape, refactor, test seam, or architecture friction | `.agents/skills/codebase-design/SKILL.md` |
| Architecture health review before choosing a refactor | `.agents/workflows/improve-codebase-architecture.md` |

Use task routes in `docs/ai/task-routes/*.md` for risk level and validation
budgets. Use this file only to choose the right reusable flow.
