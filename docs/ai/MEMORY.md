# Memory — Pumni Web OS

Long-term index of settled facts that are not yet (or not best) captured in a
canonical doc. Start here on long or resumed tasks. Keep entries short and
pointers-first. See `docs/ai/agent-behavior.md` (Memory & Compaction) for the hybrid memory model.

## How to use

- Read this at the start of a long task alongside `docs/ai/index.md`.
- Add an entry only when a decision is **settled** and does not belong in a
  canonical doc yet.
- When an entry becomes a durable rule, promote it into the right
  `docs/conventions/*` or `docs/architecture/*` file and remove it here.

## Settled facts

- **Security boundary is RLS, not UI.** Service-role/secret Supabase keys are
  server-only; browser code uses `NEXT_PUBLIC_*` only. Owner: `AGENTS.md`,
  `docs/conventions/supabase-security.md`.
- **State ownership.** Server state stays in Server Components / TanStack Query;
  Zustand holds client UI state only. Owner: `docs/conventions/data-fetching.md`.
- **Next.js 16 cache API.** Use `cacheTag`/`cacheLife`/`updateTag`; the
  single-argument `revalidateTag(tag)` is invalid. Owner:
  `docs/conventions/data-fetching.md`, `docs/ai/common-mistakes.md` §10.
- **Build is green without `transpilePackages`.** Turbopack resolves workspace
  symlinks; add `transpilePackages` only if a build/type error proves it is
  needed. Owner: `docs/conventions/transpile-packages.md`.
- **MCP runtime is optional.** `next-devtools-mcp` (`.mcp.json`) is a local dev
  aid; never depend on it for CI or gates. Owner: `docs/ai/mcp-runtime.md`.

## Decisions log

<!-- Append one-line settled decisions here: YYYY-MM-DD — decision — owner doc. -->
- 2026-06-19 — Phase 5 of the 2026 context roadmap deferred; no trigger fired
  (8 packages < 10, no onboarding/structured-output/memory-loss/cache-cost
  signal). Revisit when packages > 10 or a documented signal appears. Owner:
  `docs/plans/ai-context-2026-phase4-5-handoff.md`.
- 2026-06-19 — Memory layer chuyển hybrid: harness-managed primary (Claude Code compaction/memory tool), MEMORY.md = durable promoted-from-compaction. Owner: `docs/ai/agent-behavior.md` (Memory & Compaction), `docs/adr/0004`.
- 2026-06-19 — Context layer 2026 overhaul: trim ceremony + behavioral runner + hybrid memory + git freshness. Owner: `docs/adr/0005`.
- 2026-06-19 — Context efficacy overhaul v2: rule-efficacy metric + meta-inversion cut (context-system, memory-layer) + behavioral CI wired via stub-agent + thin CLAUDE.md + pwsh metadata alignment. Owner: `docs/adr/0006`.
