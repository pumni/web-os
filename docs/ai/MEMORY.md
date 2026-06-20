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

- **Surface identity = engineered dark-glass (not iOS frosted).** Glass uses a
  bright-top / dark-bottom rim pair (inset box-shadows) + tokenized
  `--glass-saturate` (single vibrancy knob) + directional `--shadow-glass`;
  thin neutral fill tuned to the APCA gate edge. Solid cards carry real
  elevation (`surface-raised`), so glass is reserved for true floating layers.
  OS Window/Dock/Bento are presentational chrome only (neutral window controls,
  no macOS traffic lights). Owner: `docs/conventions/design-system.md`,
  `docs/adr/0012-engineered-glass-surface-language.md`.
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
- 2026-06-19 — Memory layer chuyển hybrid: harness-managed primary (Claude Code compaction/memory tool), MEMORY.md = durable promoted-from-compaction. Owner: `docs/adr/0004-memory-layer-harness-managed.md`.
- 2026-06-19 — Context layer 2026 overhaul: trim ceremony + behavioral runner + hybrid memory + git freshness. Owner: `docs/adr/0005`.
- 2026-06-19 — Context efficacy overhaul v2: rule-efficacy metric + meta-inversion cut (context-system, memory-layer) + behavioral CI wired via stub-agent + thin CLAUDE.md + pwsh metadata alignment. Owner: `docs/adr/0006`.
- 2026-06-19 — Context efficiency 2026: design-system split to skill, risk playbook merged into agent-behavior, 5 package AGENTS.md added. Owner: `docs/adr/0007-context-efficiency-2026.md`.
- 2026-06-20 — Watch sync → explicit pure reducer (sync-machine.ts) + vendor-neutral no-op observability seam fed from transitions; XState and direct vendor SDK declined as premature. Owner: `docs/adr/0011-watch-sync-state-machine-and-observability-seam.md`.
- 2026-06-20 — Watch sync correctness follow-ups (ADR-0011 risks closed): host anchors now fan out via a low-latency realtime `broadcast` in parallel with the DB persist (followers dedupe by sequence; `shouldAcceptPlaybackAnchor` rejects stale unversioned snapshots by anchorServerTs); `useServerClock` probes N=3× per sync and keeps the min-RTT sample (Cristian-style) to bound half-RTT asymmetry error. Owner: `docs/adr/0011-watch-sync-state-machine-and-observability-seam.md`.
- 2026-06-20 — Context layer lean 2026: cut hand-rolled router (flow-router/context-map/agent-behavior/task-routes) + harness-duplicating workflows + behavioral-eval/ai-metrics machinery; single-file router `docs/ai/index.md`; tool-agnostic `.agents/` kept; validation altitude fixed (code gates vs context gates); ADR 0007 collision renumbered to 0008. Owner: `docs/adr/0009-context-layer-lean-2026.md`.
- 2026-06-20 — Surface identity → engineered dark-glass: rim pair + tokenized `--glass-saturate` + directional shadow; solid cards get `surface-raised`; OS window chrome de-Appled (neutral controls); shell stays presentational; APCA gate authoritative (tokens tuned to pass, no threshold weakened). Owner: `docs/adr/0012-engineered-glass-surface-language.md`.
- 2026-06-20 — Card layer unified (3 parallel systems + 43 ad-hoc surfaces): `Card` stays the block surface; added composition-first sub-surfaces `CardWell` (inset well), `Badge` (status pill), `IconBadge` (icon chip); `BentoGridItem` is layout-only and renders through them; dashboard + watch cards migrated; `pumniNoAdHocSurface` extended to block shorthand `border bg-muted` wells (sky-player/larger watch panels ignored pending follow-up migration). Declined a competing `Surface` primitive. Owner: `docs/adr/0013-card-composition-primitives.md`.
- 2026-06-20 — Glass visual treatment → modern glassmorphism (amends ADR-0012's glass look, keeps its structural decisions): frosted blur 16px + vibrancy `--glass-saturate` 1.4 + luminous edge pair `--glass-highlight`/`--glass-shadow-edge` (renamed from `--glass-rim-top/bottom`) + inner `--glass-sheen` background-image gradient — layered so APCA gate still reads single `--glass-bg`/`--glass-border` colours. Public `glass-*`/`GlassSurface`/`Card variant` API names kept. Content cards stay solid. Owner: `docs/adr/0014-glassmorphism-surface-treatment.md`.
