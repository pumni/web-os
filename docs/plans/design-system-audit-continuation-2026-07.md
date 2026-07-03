# Design System Audit — Continuation Plan (2026-07-03)

- **Status:** ready to execute
- **Owner:** design system (`packages/ui` + docs/skills)
- **Origin:** the remaining open items from the 2026-07-03 design-system audit that were *outside* the scope of `design-system-audit-remediation-2026-07.md` (Phases 1–5).
- **Scope:** close the tier-inversion debt (component tokens living in the primitive file); add the missing `info` tone to `Badge`; re-home the global reduced-motion safety net from `glass.css` to the motion layer. Update DTCG export, tests, and import order to stay consistent.
- **Non-goals:** no new visual design, no new surface roles, no chart-palette expansion (remains §D2 deferred), no WCAG 2.x ratio gate.
- **Execution rules:** one phase = one commit. Surgical deltas only. Every phase ends green on its listed gate before the next phase starts.

---

## Phase 1 — Fix tier inversion: extract component tokens from `tokens.css` (P2.4)

**Problem.** `tokens.css` self-describes as “raw, context-free primitives”, yet its `:root` block contains component-local variables (`--switch-*`, `--segmented-*`, `--slider-*`, `--window-control-*`) that reference semantic tokens (`--primary`, `--card`, `--neutral-50`). Their `.dark` overrides are also mixed in `tokens.css` alongside the primitive `color-scheme: dark`. This forces the DTCG export to resolve a full token map just to handle component-tier values that should live downstream of the semantic layer.

### 1a. Create `packages/ui/src/styles/component-tokens.css`

Move these four groups from `:root` in `tokens.css` into `:root` in the new file:

- `--- Switch Component Tokens ---` (current `tokens.css` ~350–362)
- `--- SegmentedPicker Component Tokens ---` (current `tokens.css` ~364–377)
- `--- Slider Component Tokens ---` (current `tokens.css` ~379–381)
- `--- Window Controls ---` (current `tokens.css` ~383–384)

### 1b. Move component `.dark` overrides into `theme.css`

Move the `.dark` overrides for the same four groups from `tokens.css` (current lines ~412–435) into the `.dark` block of `theme.css`, appending after the existing content. Keep `color-scheme: dark;` where it is in `tokens.css` (it is a document-level primitive concern).

### 1c. Wire the new file into the cascade

Add to `apps/web/src/app/globals.css`, placed **after** `theme.css` and **before** `glass.css`:

```css
@import '@pumni/ui/styles/component-tokens.css';
```

(Import order must be: primitives → brand → semantic → *component* → glass.)

### 1d. Update `lib/token-css.ts`

`packages/ui/scripts/lib/token-css.ts` hard-codes the four source files:

```ts
export const css = {
  tokens: readStyle('tokens'),
  brand: readStyle('brand'),
  theme: readStyle('theme'),
  personalization: readStyle('personalization'),
};
```

Add `component: readStyle('component-tokens'),` and include it in `buildTokenMap` so the DTCG export and any script-side resolution still sees the component-tier values.

### 1e. Update tests that read `tokens.css` directly

- `glass-contrast.test.ts` builds its own token map from `brandCss` + `themeCss` + `tokenCss`. Add `componentCss` (read from the new file) to `buildTokenMap` for completeness, even though the current contrast suite does not target component tokens.
- Any other test that regex-parses `tokens.css` for a “full” set of variables must be updated to also scan `component-tokens.css` (audit-time: none were found, but re-verify before editing).

### 1f. Re-generate DTCG export

Run `bun --filter @pumni/ui export-dtcg`, then commit the regenerated `tokens.dtcg.json`. Verify `apps/web/src/test/design-system/dtcg-export.test.ts` passes.

**Gate.** `bun --filter @pumni/ui test` + `bun --filter web test` green; `bun --filter @pumni/ui export-dtcg` + `dtcg-export.test.ts` green; `bun run ai:check` green.

---

## Phase 2 — Badge tone parity: add `info` (P3.5)

**Problem.** `Banner` supports `tone="info"` (`banner.tsx:36`), but `Badge` does not (`badge.tsx:28` variants only list `neutral|primary|success|warning|destructive`). The `--info` token exists in `theme.css`, so a tint-only `info` badge is trivial. This closes the gap in the status vocabulary without introducing `--info-foreground` (the tint pattern does not need it — the plan defers adding an unused token as drift bait).

### 2a. Add `info` to `badgeVariants`

In `badge.tsx`, insert into the `tone` object:

```ts
info: 'border-info/20 bg-info/10 text-info',
```

### 2b. Add coverage in `card-primitives.test.tsx`

Extend the existing tone-coverage assertions (if any) or add a dedicated test that renders `<Badge tone="info">Info</Badge>` and expects `data-tone="info"` and the correct Tailwind classes.

**Gate.** `bun --filter @pumni/ui test` (card-primitives suite) green.

---

## Phase 3 — Re-home the global reduced-motion safety net (P3.3)

**Problem.** `glass.css` contains the *global* reduced-motion safety net (`@media (prefers-reduced-motion: reduce) { *, ::before, ::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; } }`). This is a motion concern, not a glass concern. It also contains `.skeleton { animation: none }` under the same media query — `Skeleton` is a `feedback/` component, not a glass surface. Both belong in the motion layer.

**Surgical scope.** Move only the global `*` rule from `glass.css` to `motion.css`. Leave the `.card-spotlight` reduced-motion rule in `glass.css` (it is genuinely glass-specific). Move the `.skeleton` reduced-motion rule to `motion.css` as well (it is a component animation, not a glass surface). Keep them under `@media (prefers-reduced-motion: reduce)` in the destination file.

**Import order note.** `motion.css` is imported *after* `glass.css` in `globals.css`, but `!important` on the global rule means cascade order does not matter for correctness. Still, verify no visual regression in the design-system showcase (Motion tab + glass showcase).

### 3a. Update `glass.css`

Remove the `*, ::before, ::after` global reduced-motion block and the `.skeleton` block. Keep the `.card-spotlight::before` block.

### 3b. Update `motion.css`

Append the two transferred `@media (prefers-reduced-motion: reduce)` blocks. Update the `motion.css` header comment to remove the note “neutralised by the global reduced-motion safety net in `glass.css`” and instead state that the safety net lives in this file.

### 3c. Update docs references

Any doc/skill that says the reduced-motion safety net lives in `glass.css` (e.g., `docs/conventions/design-system.md` or `.agents/skills/ui-styling/SKILL.md`) must be updated to `motion.css`. Search: `rg -n "glass.css.*reduced" docs .agents`.

**Gate.** `bun --filter web test` (glass-performance + showcase tests) green; design-system showcase renders correctly with “Reduce motion” toggle; `bun run ai:check` green.

---

## Phase 4 — Final validation

After all phases:

```bash
bun run ai:check
bun run ai:eval
bun run lint
bun run typecheck
bun run test
```

**Gate.** All commands exit 0.

---

## Explicitly rejected (still no action)

- **z-index inline `style={{ zIndex: 'var(--z-*)' }}`** — remains intentional (wins over Radix inline styles). The `@theme` `--z-index-*` bridges stay for utility consumers.
- **`sideEffects: false` + CSS exports** — remains safe while CSS is consumed via `globals.css` `@import` only.
- **`--info-foreground`** — the tint-only status pattern does not need it; adding an unused token is drift bait. If a solid-fill info surface is ever needed (not a tint), that should be planned separately with a proper foreground + contrast gate.
- **Chart-palette expansion** — remains §D2 deferred.

---

## Deferred to future plans

- **D3 — Dark `tone="primary"` badge readability** — the regression floor was pinned in `remediation-2026-07` Phase 2b, but a real fix (new dark text stop or dropping `primary` from Badge) still needs a visual pass and an ADR if the owner decides to act.
