---
name: ui-styling
description: Apply Pumni OS design-system tokens, surface roles, motion, z-index, and personalization. Use when styling UI, adding or changing a @pumni/ui component, choosing glass vs solid surfaces, or editing design tokens / theme.css.
---

# UI Styling (Pumni OS Design System)

Load this skill when adding tokens, building/changing a component, or picking
surface/elevation/z-index utilities. The short hard rules live in
`docs/conventions/design-system.md` (read that first); this skill holds the
reference detail.

## Rules

**Token audit:** `pwsh -File .agents/skills/ui-styling/scripts/token-check.ps1`
Scans for bare hex/rgb/hsl values and arbitrary Tailwind color classes that should use OKLCH tokens.

- Token tiers: primitive (tokens.css) -> semantic (theme.css) -> component (component-tokens.css).
  Components consume semantic only. Never reference a primitive var or raw OKLCH.
- Color tokens default to the `light-dark()` function defined at `:root` rather than duplicated `.dark` overrides. `.dark` overrides are reserved for non-color properties (such as shadows, blurs, and font weights).
- Surface vocabulary is a closed set: floating glass (`GlassSurface`/`glass-*`),
  solid card (`Card variant="solid"`), inset well (`CardWell` / `Card
  variant="inset"`), control fill (`bg-muted` + hover `/80`), status tint
  (`Badge`).
- Card layer is composition-first: `Card` is the block surface; `CardWell`
  (inset well), `Badge` (status pill, `tone` + `pulse`), and `IconBadge` (icon
  chip) are the sub-surface primitives. Never hand-roll `border bg-muted` wells,
  inline status pills, or icon chips — `pumniNoAdHocSurface` blocks the well.
  `BentoGridItem` is layout-only and renders through these primitives.
- Contrast is APCA-gated per surface pair in `glass-contrast.test.ts` — Lc 60
  chrome/short-text, Lc 75+ preferred for long body on solid surfaces. Glass
  edge is NOT contrast-gated (specular rim). See
  [REFERENCE.md](/.agents/skills/ui-styling/REFERENCE.md#deriving-an-accessible-foreground-inverse-apca)
  for the Lc floor table and the inverse-APCA derivation path.
- Glass tiers: `--glass-fill` is the single opaque L/C/H fill SSOT. `--glass-tint-chrome`
  (bars/shell) and `--glass-tint-readable` / `--glass-tint` (panels) derive via
  `oklch(from var(--glass-fill) l c h / α)` — only alpha varies. Blur ladder soft **12** /
  default light **16** / dark **20** / strong **24**. Personalization soft|strong adjusts blur +
  alpha only (never re-state L/C/H in personalization overrides). Glass edge is **ungated
  specular**; text-on-glass Lc 60 is the only APCA gate.
- Glass performance: never animate `backdrop-filter`; cap stacked glass at 2
  layers (each layer forces a separate backdrop render pass; doc/skill rule);
  `will-change` is reserved for overlay transitions, not static glass.
- Radius: named utilities only (`rounded-md/lg/xl`, etc.), never
  `rounded-[Npx]`. All steps derive from `--radius-base` via `calc()`.
- z-index: one OS scale in `tokens.css` (`100`-`1200`). `--z-overlay` (`900`) is
  scrim only; floating content uses `--z-popover` (`1050`). Never hand-pick raw
  `z-40`/`z-50` for cross-component layers.
- Motion: CSS for micro-feedback (`motion-safe:`), JS motion only for
  orchestration. JS motion must call `useReducedMotion()`. Use
  `recipes.hoverLift`, `pressScale`, and `staggerItem` instead of hand-rolled
  `whileHover`. Motion tokens mirror in `lib/motion.ts`. CSS-only stagger
  uses `recipes.staggerContainer*` from `@pumni/ui` (the `starting-style.css`
  `css-stagger` utility was retired; the recipes in `lib/motion.ts` are now the
  sole stagger vocabulary).
- Personalization: accent (`coral`/`cyan`/`indigo`/`violet`/`rose`), glass
  (`soft`/`default`/`strong`), density (`comfortable`/`compact`).
  `PersonalizationScript` must be first child of `<body>` to avoid FOUC.

## Reference

Exact tokens, surface roles, radius/z-index values, state-layer tokens,
typography/motion notes, and the add-token / add-component recipes live in
[REFERENCE.md](/.agents/skills/ui-styling/REFERENCE.md). Open it on demand; do
not inline its tables here.

## Checklist

- [ ] Read `docs/conventions/design-system.md` (hard rules) first.
- [ ] No raw `oklch()`, primitive var, or Tailwind built-in palette in component classes.
- [ ] Surface is one of the closed-set roles; no `bg-{card,background,popover}/NN`.
- [ ] One `border-border`; status tint is the only `/20` border exception.
- [ ] Floating layer uses `GlassSurface`/`glass-*`; blur ladder 12/16/20/24 only (no raw `backdrop-blur-*`).
- [ ] Glass backdrop (design-system.md): glass only over colourful backdrop (blobs/media/overlay); dense/multi-line content always solid (`DialogBody` / `CardWell` / `Card variant="solid"`); on flat backgrounds → solid.
- [ ] Glass perf: no `backdrop-filter` in transitions/animations; ≤2 glass layers stacked.
- [ ] Radius/z-index use named utilities; no `rounded-[Npx]`, no raw `z-40`/`z-50` for cross-component layers.
- [ ] Motion uses recipes / `motion-safe:` CSS; `useReducedMotion()` on JS motion.
- [ ] Contrast pairs resolved by `glass-contrast.test.ts` (APCA), not eyeballed.
- [ ] New component: `cva` variants, `data-slot` hooks, exported from its role barrel (e.g. `packages/ui/src/components/form/index.ts`), no `@/` or server imports.
- [ ] `bun run ai:check` passes.

## Known Failure Modes

| Symptom | Cause | Fix |
|---|---|---|
| Glass surface looks like a grey box | Missing a colourful backdrop (media/blob); glassmorphism requires refraction to read. | Add a desktop blob or media background; or switch to `Card variant="solid"`. |
| APCA contrast gate fails | Raw token value too light/dark for the surface; or gamma-decoding missing in manual check. | Trust the `glass-contrast.test.ts` result; adjust token lightness or use Step-11 text tokens. |
| UI feels "sluggish" on scroll | Over-use of `backdrop-filter` on multiple stacked layers or large areas. | Cap glass at 2 layers; ensure `will-change` is scoped to transitions only. |
