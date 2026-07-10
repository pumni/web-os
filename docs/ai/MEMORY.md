# Memory — Pumni Web OS

Long-term index of settled facts. Pointers-first. Hybrid memory model —
harness-managed primary; this file is the durable log for decisions.

## How to use

- Read at start of long task alongside `docs/ai/index.md`.
- Add only when a decision is settled and not yet canonical.
- Promote to `docs/conventions/*` or `docs/architecture/*` then remove here.

## Settled facts

- Surface identity (glass vs solid) & Glass 2.0 (SSOT fill, contrast, relative alpha scale) → [design-system.md](../conventions/design-system.md).
- Security boundary (RLS and keys) → [AGENTS.md](../../AGENTS.md) and [supabase-security.md](../conventions/supabase-security.md).
- State ownership → [data-fetching.md](../conventions/data-fetching.md).
- Next.js 16 cache API → [data-fetching.md](../conventions/data-fetching.md) and [common-mistakes.md](common-mistakes.md).
- transpilePackages necessity → [transpile-packages.md](../conventions/transpile-packages.md).
- MCP runtime role & version pins (never `@latest`) → [mcp.md](mcp.md).
- Context layer frozen (no new ADR without measured regression) → [adr/README.md](../adr/README.md).
- Enforcement = checkCodeReferences (drift) + test-weakening (reward-hacking) + path-existence → `scripts/check-ai-context.mjs`, `scripts/review-gate-rules.mjs`.
- llms.txt is required (ADR-0022) — a curated handshake subset of docs/ai/index.md; its links/paths are gate-checked by `ai:check`, so no manual mirror is needed.
- Behavioral eval — first real run 2026-07-10 (subscription OAuth, no paid key): the runner's prose keyword-matching does NOT discriminate — a correct RLS refusal scored FAIL while a riskier draft scored PASS (keyword bingo, non-deterministic). Baseline untrustworthy; needs an LLM-judge or tool-call-trace rubric before it can gate. See `scripts/run-behavioral-evals.mjs`.
- Last upstream-standards checkpoint: 2026-07-10 (MCP, agents.md, anthropics/skills, humanlayer ACE-FCA, langchain context_engineering reviewed → runtime-context doctrine reinstated in agent-behavior.md).
