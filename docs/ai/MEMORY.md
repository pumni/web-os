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

- **Surface identity = glassmorphism for floating layers; solid cards use
  `surface-raised`.** The 5-element model, perf budget (≤2 stacked layers), and
  backdrop requirement live in their owner docs — do not restate here. Owner:
  `docs/conventions/design-system.md`, ADR-0012/0014/0015/0016.
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

<!-- One line per settled decision: YYYY-MM-DD — decision — owner doc. The owner
holds the detail; keep these as pointers, never restate the ADR here. -->
- 2026-06-19 — Phase 5 of the 2026 context roadmap deferred (no trigger: <10 packages, no documented signal). Revisit when packages >10. Owner: `docs/plans/ai-context-2026-phase4-5-handoff.md`.
- 2026-06-19 — Memory layer → hybrid: harness-managed session memory primary; MEMORY.md = durable promoted-from-compaction log. Owner: `docs/adr/0004-memory-layer-harness-managed.md`.
- 2026-06-19 — Context overhauls ADR-0005/0006/0007 **superseded by ADR-0009**; files kept as history.
- 2026-06-20 — Context layer lean: single-file router `docs/ai/index.md`, tool-agnostic `.agents/`, harness-native routing, validation altitude fixed. Owner: `docs/adr/0009-context-layer-lean-2026.md`.
- 2026-06-20 — Watch sync architecture: pure reducer + parallel broadcast/DB anchor dedupe + Cristian min-RTT clock + transition-derived telemetry. Owner: `docs/adr/0011-watch-sync-state-machine-and-observability-seam.md`, skill `.agents/skills/watch-sync`.
- 2026-06-20/21 — Surface system → glassmorphism (engineered dark-glass, card composition primitives `CardWell`/`Badge`/`IconBadge`, backdrop requirement, sheen removed → 5-element model). Owner: ADR-0012/0013/0014/0015/0016, `docs/conventions/design-system.md`.
- 2026-06-21 — Context layer dedup + re-bloat guardrail: static-rule table de-duplicated (registry `review-gate-rules.mjs` = SoT, doc points to it); MCP/MEMORY duplication trimmed; added `watch-sync` skill; added hard `sizeBudgets` to the `ai:check` gate so high-traffic context files can't silently regrow. Owner: `scripts/ai-context.manifest.json`, `.agents/skills/watch-sync`.
- 2026-06-20 — Glass card backdrop requirement (supplements ADR-0014, no token/API change): a `Card variant="glass"` (or `glass-panel`) MUST float over a colourful backdrop (OS desktop blobs / media / the `showcase.tsx` 2-blob wrapper) — otherwise use `variant="solid"`. Banned glass for dense content (forms/long text/tables) and flat backgrounds. Migrated the 3 violating production sites (watch-lobby ×2, side-dock); `/design-trends` promoted to the gold-reference teaching page. Owner: `docs/adr/0015-glass-card-backdrop-requirement.md`.
