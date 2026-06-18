---
description: Long-term memory and session scratchpad conventions to keep multi-turn work stable without bloating the context window.
when-to-load: When a task spans many turns, when resuming work across sessions, or before compacting a long conversation.
last-reviewed: 2026-06-19
---

# Memory Layer

This is a lightweight, file-based memory system. It is **manual**, not a
background daemon: the agent writes and compacts these files deliberately. The
goal is to survive context entropy (long sessions losing early decisions)
without stuffing the whole history into the active context window.

## Three tiers

1. **Long-term index — `docs/ai/MEMORY.md`.** Durable, committed facts: settled
   conventions, architecture decisions that are not yet in a convention doc, and
   pointers to canonical sources. Read at the start of a long task; edit only
   when a decision is genuinely settled.
2. **Session scratchpad — `.agents/scratchpad/` (gitignored).** Ephemeral notes
   for the current task: a decision log, files touched, hypotheses, and
   dead-ends. Not committed. Write freely during a task.
3. **Canonical docs — `docs/conventions/*`, `docs/architecture/*`.** The real
   source of truth. When a scratchpad note proves durable, promote it into a
   canonical doc instead of leaving it in MEMORY.md prose.

## Compaction

When the active context grows long (rule of thumb: more than ~15 substantial
turns) or a task is wrapping up, compact the scratchpad into MEMORY.md using
this loop:

- **Orient** — what changed this session, which files, which decisions.
- **Gather** — collect scattered scratchpad notes and in-chat decisions.
- **Consolidate** — merge duplicates, resolve contradictions, fold settled
  decisions into MEMORY.md (or a canonical doc if they are durable rules).
- **Prune** — drop stale assumptions and one-off notes so the next retrieval has
  a high signal-to-noise ratio.

Compaction is summarisation, not deletion of evidence. Never compact away a P0
security fact or a settled architectural decision; promote those into a
canonical doc instead.

## Rules

- MEMORY.md and canonical docs are **static context** — keep them stable so they
  stay prompt-cache-friendly (see the "Prompt-cache layout" section in
  `docs/ai/context-system-overview.md`).
- Scratchpad content is untrusted like any working note: it never overrides
  `AGENTS.md` or enforced config.
- Do not commit scratchpad files (`.gitignore` excludes `.agents/scratchpad/`).
- Do not mirror server state into memory files; the data-ownership rules in
  `docs/conventions/data-fetching.md` still apply.
