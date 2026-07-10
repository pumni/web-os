# Memory — Pumni Web OS

Long-term index of settled facts. Pointers-first. Hybrid memory model —
harness-managed primary; this file is the durable log for decisions.

## How to use

- Read at start of long task alongside root `AGENTS.md`.
- Add only when a decision is settled and not yet canonical.
- Promote to `docs/conventions/*` or `docs/architecture/*` then remove here.

## Settled facts

- Surface identity (glass vs solid) & Glass 2.0 (SSOT fill, contrast, relative alpha scale) → [design-system.md](../conventions/design-system.md).
- Security boundary (RLS and keys) → [AGENTS.md](../../AGENTS.md) and [supabase-security.md](../conventions/supabase-security.md).
- State ownership → [data-fetching.md](../conventions/data-fetching.md).
- Next.js 16 cache API → [data-fetching.md](../conventions/data-fetching.md) and [common-mistakes.md](common-mistakes.md).
- transpilePackages necessity → [transpile-packages.md](../conventions/transpile-packages.md).
- MCP runtime role & version pins (never `@latest`) → [mcp.md](mcp.md).
- Context layer v2 landed — [ADR-0027](../adr/0027-context-layer-v2-standards-alignment.md); maintenance via `context-health` skill.
- Enforcement = checkCodeReferences (drift) + checkClaudeShims + checkEncodingHygiene + checkSkillEvalsAndPaths + checkNavMapSync + test-weakening (reward-hacking) + path-existence → `scripts/check-ai-context.mjs`, `scripts/review-gate-rules.mjs`.
- Behavioral eval — keyword grader proven non-discriminating (2026-07-10 run: passRateA=passRateB=0.111). Phase 5 added LLM-as-judge (`--judge` flag): 9 per-task rubrics, constitutional prompt (P0–P4), advisory/fail-open until >80% calibration. ADR-0026. See `scripts/run-behavioral-evals.mjs`.
- Last upstream-standards checkpoint: 2026-07-10 (MCP, agents.md, anthropics/skills, humanlayer ACE-FCA, langchain context_engineering reviewed → runtime-context doctrine integrated in root AGENTS.md).
