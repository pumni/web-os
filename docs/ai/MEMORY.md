# Memory — Pumni Web OS

Long-term index of settled facts. Pointers-first. Hybrid memory model —
harness-managed primary; this file is the durable log for decisions.

## How to use

- Read at start of long task alongside `docs/ai/index.md`.
- Add only when a decision is settled and not yet canonical.
- Promote to `docs/conventions/*` or `docs/architecture/*` then remove here.

## Settled facts

- Surface identity (glass vs solid) & Glass 2.0 (SSOT fill, contrast, relative alpha scale) → [design-system.md](../conventions/design-system.md), [ADR-0012](../adr/0012-engineered-glass-surface-language.md).
- Security boundary (RLS and keys) → [AGENTS.md](../../AGENTS.md) and [supabase-security.md](../conventions/supabase-security.md).
- State ownership → [data-fetching.md](../conventions/data-fetching.md).
- Next.js 16 cache API → [data-fetching.md](../conventions/data-fetching.md) and [common-mistakes.md](common-mistakes.md).
- transpilePackages necessity → [transpile-packages.md](../conventions/transpile-packages.md).
- MCP runtime role & version pins (never `@latest`) → [mcp.md](mcp.md).
- Context layer frozen (no new ADR without measured regression) → [adr/README.md](../adr/README.md).
- Enforcement = checkCodeReferences (drift) + test-weakening (reward-hacking) + path-existence → `scripts/check-ai-context.mjs`, `scripts/review-gate-rules.mjs`.
- llms.txt is required (ADR-0022) — keep in sync with docs/ai/index.md.
