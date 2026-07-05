# Memory — Pumni Web OS

Long-term index of settled facts. Pointers-first. Hybrid memory model —
harness-managed primary; this file is the durable log for decisions.

## How to use

- Read at start of long task alongside `docs/ai/index.md`.
- Add only when a decision is settled and not yet canonical.
- Promote to `docs/conventions/*` or `docs/architecture/*` then remove here.

## Settled facts

- Surface identity (glass vs solid) → [design-system.md](../conventions/design-system.md) and [ADR-0012](../adr/0012-engineered-glass-surface-language.md).
- Security boundary (RLS and keys) → [AGENTS.md](../../AGENTS.md) and [supabase-security.md](../conventions/supabase-security.md).
- State ownership → [data-fetching.md](../conventions/data-fetching.md).
- Next.js 16 cache API → [data-fetching.md](../conventions/data-fetching.md) and [common-mistakes.md](common-mistakes.md).
- transpilePackages necessity → [transpile-packages.md](../conventions/transpile-packages.md).
- MCP runtime role → [mcp.md](mcp.md).
- Context layer frozen — no new ADR without measured regression → [ADR-0009](../adr/0009-context-layer-lean-2026.md), [adr/README.md](../adr/README.md).
- Enforcement = checkCodeReferences (drift) + test-weakening (reward-hacking) → `scripts/check-ai-context.mjs`, `scripts/review-gate-rules.mjs`.
- Context layer pruning metric → [measure-prune](../plans/archive/context-layer-measure-prune-2026-07.md).
- 2026-07 refresh → [ADR-0024](../adr/0024-context-layer-2026-07-standards-refresh.md).
- llms.txt is required (ADR-0022) — keep in sync with docs/ai/index.md.
- 2026-07-05 — Glass 2.0 & Grain: Completed ADR-0012 alignment. Specular variant preserves borders. APCA Lc 25 gate rescoped to dominant top edge; bottom edge exempt shadow `oklch(0.2 0.03 270 / 0.35)`. Upgraded `glass-grain` to `::after` with overlay mix-blend, 200px tile, and mode-dependent opacity (light 0.05 / dark 0.07).
- 2026-07-05 — Gradient bevel ring: per-side border colours on glass-panel/window retired (hard diagonal miter seams on rounded corners); edge is now a masked 1px `::before` gradient ring (135°, edge-top → edge-bottom) + transparent metric border for a11y fallback re-colouring. Specular = conic layer on the same ring. Tokens & gate scope unchanged.
