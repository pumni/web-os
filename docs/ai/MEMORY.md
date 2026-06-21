# Memory — Pumni Web OS

Long-term index of settled facts that are not yet (or not best) captured in a
canonical doc. Start here on long or resumed tasks. Keep entries short and
pointers-first. Hybrid memory model: harness-managed session memory/compaction is
primary; this file is the durable log for decisions promoted out of compaction.
Owner: `docs/adr/0004-memory-layer-harness-managed.md`.

## How to use

- Read this at the start of a long task alongside `docs/ai/index.md`.
- Add an entry only when a decision is **settled** and does not belong in a
  canonical doc yet.
- When an entry becomes a durable rule, promote it into the right
  `docs/conventions/*` or `docs/architecture/*` file and remove it here.

## Settled facts

- Surface identity (glass vs solid) → [design-system.md](file:///d:/Dev/web-os/docs/conventions/design-system.md) and [ADR-0012](file:///d:/Dev/web-os/docs/adr/0012-engineered-glass-surface-language.md).
- Security boundary (RLS and keys) → [AGENTS.md](file:///d:/Dev/web-os/AGENTS.md) and [supabase-security.md](file:///d:/Dev/web-os/docs/conventions/supabase-security.md).
- State ownership → [data-fetching.md](file:///d:/Dev/web-os/docs/conventions/data-fetching.md).
- Next.js 16 cache API → [data-fetching.md](file:///d:/Dev/web-os/docs/conventions/data-fetching.md) and [common-mistakes.md](file:///d:/Dev/web-os/docs/ai/common-mistakes.md).
- transpilePackages necessity → [transpile-packages.md](file:///d:/Dev/web-os/docs/conventions/transpile-packages.md).
- MCP runtime role → [mcp.md](file:///d:/Dev/web-os/docs/ai/mcp.md).
