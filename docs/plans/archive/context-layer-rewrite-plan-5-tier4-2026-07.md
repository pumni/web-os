# Plan 5 — Tier 4: Deep Canonical Docs + Memory

**Depends on:** Plan 4. Master: `context-layer-rewrite-master-2026-07.md`.
**Goal:** The deepest tier holds lean, correct canonicals: `design-system.md`
split four ways (F11), memory/ledger entries refreshed, starter-era remnants
removed. Fixes: F11, remainder of F10; §6 cluster #8.

**Non-goals:** changing any CSS token *values* or component code; ADR content
beyond the listed amendments; gate internals (Plan 6).

**Gate:** `bun run ai:check && bun run ai:eval` per step; `ai:premerge` close.

## Pre-flight

- [ ] Plan 4 DoD confirmed; `bun run ai:premerge` green.
- [ ] Record `wc -l docs/conventions/design-system.md` (expect ~386) as the
      before-figure for ADR-0027.

## Steps

1. **Split `design-system.md` — extraction first, no rewording.** Create the
   four destinations before shrinking the source:
   a. **Stays (target ≤~120 lines):** token SSOT file list, brand contract
      (compressed), anti-slop table, three token tiers, glass placement
      product rule + decision tree, the 8 numbered hard rules, golden rules,
      Tailwind-v4 note, state-layer pointer.
   b. **→ `.agents/skills/ui-styling/REFERENCE.md`:** Apple/M3 tier map, alpha
      matrix, blur ladder table, delineation doctrine, border-consumption
      table + extended discussion, APCA/WCAG-bridge detail, accent Lc-45
      font-floor detail. **Dedupe on arrival** — REFERENCE.md and SKILL.md
      already carry blur/tier lines; each fact keeps exactly one home
      (REFERENCE table wins; SKILL keeps one-line rules + pointer).
   c. **→ deleted (git preserves):** historical narrative ("an earlier
      revision imposed Lc 25 … removed"), superseded-plans blockquote,
      "Verified 2026-07-09" date-stamp prose (the recheck ritual lives in the
      `context-health` skill).
   d. **→ pointer:** "Extended glass token set" hand-copied token list →
      "Token inventory: `packages/ui/src/styles/{tokens,theme,glass}.css`
      (source of truth — do not copy lists into docs)."
   Update inbound refs: `ui-styling/SKILL.md` "read design-system first" line
   stays valid; `packages/ui/AGENTS.md` token pointers unchanged.
   Manifest: reset design-system budget to new size × 1.2.
   Verify: gates; `rg -c 'blur-glass' docs .agents` — each value appears in
   exactly one markdown home.

2. **Confirm the visual gates still own the cascade** (no doc now contradicts
   them): `bun run test --filter @pumni/ui` (glass-contrast, border-consumption
   drift guards) green. No code edits expected.

3. **`docs/ai/MEMORY.md` refresh.** Remove/replace entries invalidated by the
   rewrite (llms.txt-required entry, context-layer-frozen entry → replaced by
   "Context layer v2 landed — ADR-0027; maintenance via `context-health`
   skill"); keep settled product facts. Stay within budget.
   Verify: `bun run ai:check`.

4. **Starter-era remnants (F10 remainder).** Delete
   `docs/starter/rename-checklist.md` (+ empty `docs/starter/`). Align
   identity in one sentence each: root `README.md` and `apps/web/README.md`
   intro ("Pumni Web OS" product, starter heritage noted). No other README
   edits.
   Verify: `bun run ai:check`; Lychee args in `docs-health.yml` unaffected.

5. **`golden-examples.md` audit-pass.** Confirm every `path#symbol` anchor
   still resolves (gate covers paths; verify symbols by spot-read). Add
   nothing.
   Close: `bun run ai:premerge`; ADR-0027 changelog (before/after line counts).

## Definition of done

- [ ] `design-system.md` ≤~120 lines; REFERENCE.md is the single home for
      every moved table; no fact duplicated between them (step-1 rg check).
- [ ] `@pumni/ui` test suite green (no behavioral drift from doc moves).
- [ ] MEMORY.md current; starter docs gone; READMEs identity-aligned.
- [ ] `bun run ai:premerge` green.

## Risks

| Risk | Severity | Mitigation |
|---|---|---|
| A hard rule is misclassified as "doctrine" and leaves the convention | H | Step-1a KEEP list is explicit; diff-review against audit §9.1 verdict before commit |
| REFERENCE.md grows past skill-reference size norms | M | It is load-on-demand (tier-2 resource); spec norm is small *per-topic* files — split REFERENCE by topic if >400 lines |
| Token list pointer loses discoverability | L | Anti-slop table + decision tree remain in the convention; inventory is one `Read` away |
