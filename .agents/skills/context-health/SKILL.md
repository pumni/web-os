---
name: context-health
description: Review skill description freshness and perform quarterly upstream-standards checkpoints. Use when manually auditing context layer drift, reviewing description freshness, or performing quarterly upstream checkpoints.
---

# Context Health

Lightweight audit to catch skill description drift and align with evolving upstream agent context standards.

Note: Machine validation is handled automatically via `bun run ai:check` (run this first).

## Rules

- Run `bun run ai:check` before performing manual audits.
- Review skill descriptions whenever skills are added or edited in bulk.
- Perform upstream standards alignment review quarterly.
- Record standards alignment check dates in `docs/ai/MEMORY.md`.
- Between quarterly checkpoints, context-layer edits happen only in response to a recorded drift incident, a failing gate, or a task that changes documented behavior — never as standalone polish. (Churn guard: 30+ context-layer plans accumulated in 2026-06/07.)

## Known Failure Modes

| Symptom | Cause | Fix |
|---|---|---|
| Skill descriptions drift from implementation | Descriptions not updated after feature refactors | Manually review descriptions against current codebase; run `bun run ai:skills:sync` |
| Upstream standards diverge | Quarterly review skipped | Check standard references and author ADRs for necessary structural changes |

## Loop

### 1. Description Freshness Review

Manually skim each skill `description` frontmatter field against the current codebase. Flag any that reference:
- Deleted or renamed file paths.
- Stale technology names (e.g. old library version).
- Trigger clauses that no longer match real task patterns.

Update descriptions and run `bun run ai:skills:sync` to regenerate shims.

### 2. Upstream-Standards Checkpoint (Quarterly)

Re-read current upstream specifications and note any divergence worth an ADR (cite a recorded incident per `docs/adr/README.md`):
- MCP — `modelcontextprotocol.io`
- AGENTS.md — `agents.md`
- Agent Skills — `anthropics/skills`
- Coding-agent context engineering — `humanlayer/advanced-context-engineering-for-coding-agents`

Record the check date in `docs/ai/MEMORY.md`.

### 3. Harness loading canary (quarterly)

Perform these verification steps to prove context is loading correctly in the agent harness:
- (1) Fresh Claude Code session at repo root: confirm the loaded context contains the `<SECURITY_MANDATES>` block (proves the `CLAUDE.md` `@AGENTS.md` import chain loads).
- (2) Touch/edit a file under `apps/web/src/app/**`: confirm `.claude/rules/nextjs-*` content surfaces in-session (proves `paths:` scoping loads).
- (3) Work on a file under `packages/ui/`: confirm the nested `AGENTS.md` content is in context (proves closest-wins).

Any failure is an F1-class incident: record it in `docs/ai/MEMORY.md` immediately and open a remediation. Record the canary date + pass/fail in `docs/ai/MEMORY.md` either way.

## Checklist

- [ ] Run `bun run ai:check` to ensure structural validation passes.
- [ ] Description freshness review completed for all active skills.
- [ ] Upstream-standards check date recorded in `docs/ai/MEMORY.md` (for quarterly checks).
