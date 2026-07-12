# Memory — Pumni Web OS

Long-term index of settled facts. Pointers-first. Hybrid memory model —
harness-managed primary; this file is the durable log for decisions.

## How to use

- Read at start of long task alongside root `AGENTS.md`.
- Add only when a decision is settled and not yet canonical.
- Promote to `docs/conventions/*` or `docs/architecture/*` then remove here.

## Settled facts

- Surface identity (glass vs solid) & Glass 2.0 (SSOT fill, contrast, alpha scale) → [design-system.md](../conventions/design-system.md).
- Security boundary (RLS and keys) → [AGENTS.md](../../AGENTS.md) and [supabase-security.md](../conventions/supabase-security.md).
- State ownership & Next.js 16 cache API → [data-fetching.md](../conventions/data-fetching.md), [common-mistakes.md](common-mistakes.md).
- transpilePackages necessity → [transpile-packages.md](../conventions/transpile-packages.md).
- MCP runtime role & version pins (never `@latest`) → [mcp.md](mcp.md).
- Context layer v2 landed — [ADR-0027](../adr/0027-context-layer-v2-standards-alignment.md); maintenance via `context-health`.
- Enforcement checks (drift, shims, encoding, skills, nav, testing) in `scripts/check-ai-context.mjs`, `scripts/review-gate-rules.mjs`.
- Behavioral eval LLM-as-judge (ADR-0026) in `scripts/run-behavioral-evals.mjs`.
- Upstream standards checkpoint: 2026-07-10 (runtime-context integrated in root AGENTS.md).
- SaaS billing platform Phase 0-2 corrective remediation (R1–R11) completed: added Upstash env var validation, centralized checkout validation schema, corrected watch room RLS quota logic to count active rooms only, consolidated migration 024 into 023, regenerated DB types, hardened Server Actions with rate limiting and Sentry instrumentation, and updated conventions and documentation (2026-07-12).
