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

- Surface identity (glass vs solid) → [design-system.md](../conventions/design-system.md) and [ADR-0012](../adr/0012-engineered-glass-surface-language.md).
- Security boundary (RLS and keys) → [AGENTS.md](../../AGENTS.md) and [supabase-security.md](../conventions/supabase-security.md).
- State ownership → [data-fetching.md](../conventions/data-fetching.md).
- Next.js 16 cache API → [data-fetching.md](../conventions/data-fetching.md) and [common-mistakes.md](common-mistakes.md).
- transpilePackages necessity → [transpile-packages.md](../conventions/transpile-packages.md).
- MCP runtime role → [mcp.md](mcp.md).
- Context layer is settled (frozen) — no new context-layer ADR without a *measured* regression → [ADR-0009](../adr/0009-context-layer-lean-2026.md), [ADR-0013](../adr/0013-context-layer-cleanup-2026-06.md), [adr/README.md](../adr/README.md).
- Enforcement = deterministic gates over discipline: doc→code drift via `checkCodeReferences` (`path#symbol`); verify-loop reward-hacking via the `test-weakening` rule → `scripts/check-ai-context.mjs`, `scripts/review-gate-rules.mjs`, [common-mistakes.md](common-mistakes.md).
- Context layer — how to know it works / when to prune → [measure-prune plan](../plans/context-layer-measure-prune-2026-07.md).
- `llms.txt` is a required context file (ADR-0022 supersedes ADR-0013 §4) — keep it in sync with `docs/ai/index.md`; do not delete.
