# Plan 2 — Tier 1: Path-Scoped Rules, Canonical Inversion

**Depends on:** Plan 1. Master: `context-layer-rewrite-master-2026-07.md`.
**Goal:** Canonical Next.js 16 content lives in the neutral layer;
`.claude/rules/*` become thin path-scoped pointers (`paths:`, loaded only on
touch); the Supabase migration rule joins them. Fixes: F2, F3, F15, the async
glob asymmetry, and the cache-semantics duplication cluster (audit §6 #4).

**Non-goals:** skill body rewrites beyond pointer swaps (Plan 3);
design-system (Plan 5); gate internals (Plan 6).

**Gate:** `bun run ai:check` per step; `bun run ai:premerge` to close.

## Pre-flight

- [ ] Plan 1 DoD confirmed; `bun run ai:premerge` green.

## Steps

1. **Create `docs/conventions/nextjs-16.md` (Q12) — the single canonical.**
   Merge, deduplicating to one home:
   - full body of `.claude/rules/nextjs-async-apis.md` (await table, typegen,
     signature pair);
   - full body of `.claude/rules/nextjs-cache-components.md` (placement,
     `cacheLife` floor, parameterized `cacheTag`, `updateTag` scope, two-arg
     `revalidateTag`, Suspense rules);
   - "Next.js Route Props" section from `server-client-boundary.md` (remove
     there, leave a pointer);
   - the PPR/static-shell prose currently in `data-fetching.md` L15–32.
   Frontmatter `description` with trigger keywords. Target ≤160 lines.
   Manifest: add to `requiredFiles` + `frontmatterRequired` + budget.
   Verify: `bun run ai:check`.

2. **Shrink both `.claude/rules/*` files to ~10-line pointers** with corrected
   frontmatter:
   - `paths:` (Claude Code native) **replacing** `globs:`; keep a `globs:` copy
     only if another tool in use consumes it (none today — drop it).
   - Fix the asymmetry: async rule paths cover `apps/web/src/app/**/*.{ts,tsx}`
     **and** `apps/web/src/features/**/{actions,queries}.ts`.
   - Body: 3–5 non-negotiable one-liners + "Canonical:
     `docs/conventions/nextjs-16.md` — read before writing Next.js code."
   Manifest: shrink both size budgets accordingly.
   Verify: `bun run ai:check`; manual smoke — session editing an `app/` file
   gets the rule injected, a docs-only session does not.

3. **Add `.claude/rules/supabase-migrations.md` (Q8).** ~5 lines:
   `paths: ["supabase/migrations/**"]`, body = P0 reminder + "Canonical:
   `docs/conventions/supabase-security.md`; invoke the `supabase-migration`
   skill." Manifest: add file + budget.
   Verify: `bun run ai:check`.

4. **Collapse the duplication cluster (§6 #4)** — every prose copy of cache
   semantics becomes a pointer to `nextjs-16.md`:
   - `data-fetching.md`: L15–32 block → 3-line pointer (state-ownership content
     stays untouched — it is this file's own canonical).
   - `docs/ai/common-mistakes.md` #10: point SSOT line at `nextjs-16.md`;
     **fold #13 (two-arg revalidateTag) into #10** and renumber nothing —
     leave a tombstone line "13. merged into 10" to keep numbering stable
     until Plan 3 converts references to rule ids.
   - `apps/web/AGENTS.md`: flip the "Hard rules (SSOT)" section — canonical is
     now `docs/conventions/nextjs-16.md`; `.claude/rules/*` described as
     "Claude Code path-scoped pointers (generated tier)".
   Verify: `bun run ai:check && bun run ai:eval`.

5. **Skill pointer swaps (mechanical only):** `server-component-read` and
   `server-action` references `.claude/rules/nextjs-cache-components.md` →
   `docs/conventions/nextjs-16.md`. Run `bun run ai:skills:sync`.
   Verify: `bun run ai:check`.

6. **Amend ADR-0003 (F15).** Status → "Accepted (amended 2026-07)"; correct the
   rules description: path-scoped via `paths:` as of this change; the
   permissions-defer decision stands unchanged. Date-stamped inline changelog
   per ADR conventions. Run `bun run ai:adr:sync`.
   Verify: `bun run ai:check`.

7. **Update `scripts/context-map.json` owners**: `data-fetching` subsystem
   owner `.claude/rules/nextjs-cache-components.md` →
   `docs/conventions/nextjs-16.md`. (Subsystem dedupe itself is Plan 6.)
   Close: `bun run ai:premerge`; amend ADR-0027 changelog.

## Definition of done

- [ ] `docs/conventions/nextjs-16.md` exists, is the only file containing the
      cache/async rule bodies (`rg 'cacheLife' --type md` shows canonical +
      pointers only).
- [ ] Both legacy rules ≤ ~15 lines, `paths:` frontmatter, no `globs:`.
- [ ] Third rule exists for `supabase/migrations/**`.
- [ ] Docs-only session loads zero Next.js rule tokens (manual smoke).
- [ ] ADR-0003 amended; `bun run ai:premerge` green.

## Risks

| Risk | Severity | Mitigation |
|---|---|---|
| `paths:` frontmatter behaves differently than documented on current CLI | M | Manual smoke in step 2 before proceeding; if unsupported, keep rules as pointers (still ~10 lines — budget win stands) and record in ADR-0027 |
| A consumer still teaches the old rule path | L | `rg '\.claude/rules/nextjs'` sweep in steps 4–5 |
| Static analyzer rules (ADR-0002) reference moved prose | L | Analyzer keys off code regexes, not docs; `ai:eval` in step 4 confirms |
