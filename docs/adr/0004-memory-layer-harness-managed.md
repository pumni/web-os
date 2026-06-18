# 0004. Memory Layer Harness Managed Hybrid Model

- **Status:** Accepted
- **Date:** 2026-06-19
- **Owner:** AI context layer (see `docs/ai/index.md`)

## Context

Prior to this decision, the repository used a manual, three-tier context memory system (committed `docs/ai/MEMORY.md` index + gitignored `.agents/scratchpad/` session notes + canonical docs). The compaction loop of about 15 turns was manually driven by the agent.

With 2026-era agent harnesses (like Claude Code), built-in session memory management (compaction, memory tools, and subagents) is native and highly effective. Maintaining a completely manual scratchpad system in parallel introduces redundant overhead and increases the risk of split-brain/drifting memory states.

However, completely discarding the manual memory file would lose the tool-agnostic committed log (`MEMORY.md`), which is essential when switching between different harnesses or IDEs.

## Decision

**Adopt a hybrid memory model.** 

1. **Harness-Managed Session Memory as Primary:** The active session history and compaction are fully delegated to the harness (e.g. Claude Code's native session compaction). The manual compaction loop (15-turn loop) is deprecated.
2. **Durable `MEMORY.md` as Tool-Agnostic durable log:** Promoted facts that are stable are logged in `docs/ai/MEMORY.md` to ensure they persist across session boundaries and are readable by any agent tool.
3. **Fallback Scratchpad:** The `.agents/scratchpad/` directory is deprecated and only used as a fallback if the active harness lacks managed memory capabilities.

## Consequences

**Positive:**
- Eliminates manual session memory overhead (compaction loops).
- Prevents drift between the harness's internal memory and manual scratchpad files.
- Durable facts still persist in Git and remain accessible to all tools via `MEMORY.md`.

**Negative / costs:**
- Relies on the user's execution environment having memory/compaction capabilities.
- Requires discipline to manually promote facts from session compaction output into `MEMORY.md`.

**Neutral:**
- Directory structure remains unchanged, but scratchpads are marked deprecated.

## Alternatives considered

- **Pure manual memory (status quo):** Rejected as it under-utilizes 2026 harness capabilities and leads to session-state loss when the context window fills.
- **Pure harness-managed memory:** Rejected because it ties memory state completely to the specific tool session, causing loss of memory when switching tools or starting a fresh session.

## References

- `docs/ai/memory-layer.md` — memory-layer convention.
- `docs/ai/MEMORY.md` — committed durable log.
- `docs/adr/0001-structured-prompting-and-model-routing.md` — prompt-playbook decision.
