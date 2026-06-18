---
name: ui-styling
description: Apply Pumni OS design-system tokens, surface roles, motion, z-index, and personalization when styling UI or building @pumni/ui components.
---

# UI Styling (Pumni OS Design System)

Load this skill when adding tokens, building/changing a component, or picking
surface/elevation/z-index utilities. The short hard rules live in
`docs/conventions/design-system.md` (read that first); this skill holds the
reference detail.

## Rules

- Token tiers: primitive (`tokens.css`) -> semantic (`theme.css`) -> component.
  Components consume semantic only. Never reference a primitive var or raw OKLCH.
- Surface vocabulary is a closed set: floating glass (`GlassSurface`/`glass-*`),
  solid card (`Card variant="solid"`), inset well (`Card variant="inset"` /
  `bg-muted`), control fill (`bg-muted` + hover `/80`), status tint (`/10` fill
  + `/20` border).
- Contrast is APCA-gated: Lc 60 text / Lc 25 UI via
  `apps/web/src/test/design-system/glass-contrast.test.ts`. Do not reintroduce a
  WCAG 2.x ratio gate.
- Radius: named utilities only (`rounded-md/lg/xl`, etc.), never
  `rounded-[Npx]`. All steps derive from `--radius-base` via `calc()`.
- z-index: one OS scale in `tokens.css` (`100`-`1200`). `--z-overlay` (`900`) is
  scrim only; floating content uses `--z-popover` (`1050`). Never hand-pick raw
  `z-40`/`z-50` for cross-component layers.
- Motion: CSS for micro-feedback (`motion-safe:`), JS motion only for
  orchestration. JS motion must call `useReducedMotion()`. Use
  `recipes.hoverLift`, `pressScale`, and `staggerItem` instead of hand-rolled
  `whileHover`. Motion tokens mirror in `lib/motion.ts`.
- Personalization: accent (`indigo`/`violet`/`rose`), glass
  (`soft`/`default`/`strong`), density (`comfortable`/`compact`).
  `PersonalizationScript` must be first child of `<body>` to avoid FOUC.

## Reference

### Semantic tokens

| Token | Role |
| --- | --- |
| `background` / `foreground` | Page surface + default text |
| `card` / `popover` (+ `-foreground`) | Card defaults to a solid raised surface; glass is opt-in for floating cards; inset is the recessed well. |
| `primary` (+ `-foreground`) | Brand actions |
| `secondary` / `muted` / `accent` (+ `-foreground`) | Subdued + hover surfaces |
| `destructive` / `success` / `warning` (+ `-foreground`) | Status |
| `border` / `input` / `field` / `ring` | Hairlines, fields, input backdrops, focus ring |
| `glass-bg` / `glass-border` / `glass-edge` / `glass-highlight` / `glass-scrim` / `glass-blur` | Translucent glass surfaces |
| `overlay` | Modal / sheet / command-palette scrim (`bg-overlay`) |
| `brand-gradient-*` | Brand gradient stops for display text only |
| `desktop-blob-*` | Decorative OS wallpaper ambience |
| `window-control-*` | Window traffic-light controls |
| `chart-1` ... `chart-5` | Data-visualization series colors |

Primitive color variables (`--indigo-*`, `--violet-*`, `--neutral-*`, status
scales, and raw `oklch(...)`) are restricted to token/theme files.

### Surface vocabulary

| Role | How to build it | Use for |
| --- | --- | --- |
| Floating glass | `GlassSurface variant="panel\|bar\|window\|titlebar"` or the matching `glass-*` utility | Floating layers: dialogs, sheets, popovers, command palette, toast, topbar, dock, sidebar rail, OS windows, pills/overlays |
| Solid card | `<Card>` / `variant="solid"` -> `border bg-card shadow-sm rounded-xl` | Primary content surfaces |
| Inset well | `<Card variant="inset">` or `bg-muted border border-border` | Nested wells inside cards: stat tiles, list rows, scroll wells |
| Control fill | `bg-muted` plus `motion-safe:hover:bg-muted/80` | Small inline controls: tabs, chips, code pills |
| Status tint | `bg-{destructive\|warning\|success\|primary}/10 border-{...}/20 text-{...}` | Inline status chips/banners |

### Radius scale

| Utility | Value at base 10px | Typical use |
| --- | --- | --- |
| `rounded-xs` | 4px | Checkboxes, tiny indicators, tooltip arrow |
| `rounded-sm` | 6px | Menu items, inline chips |
| `rounded-md` | 8px | Buttons, inputs, dropdown/menu content |
| `rounded-lg` | 10px | Dialogs |
| `rounded-xl` | 14px | Cards, windows, sheets, command palette |
| `rounded-2xl` / `rounded-3xl` | 18px / 26px | Large hero surfaces |

### z-index scale

| Token / utility | Value | Layer |
| --- | --- | --- |
| `--z-desktop` | `-1` | Fixed OS wallpaper |
| `--z-base` | `0` | In-flow app content |
| `z-window` / `z-window-active` | `100` / `110` | OS windows |
| `z-sidebar` | `700` | Persistent shell rail |
| `z-dock` | `800` | Floating dock |
| `z-topbar` | `850` | Top app bar |
| `z-overlay` | `900` | Scrim only |
| `z-modal` | `1000` | Dialog / sheet panel |
| `z-popover` | `1050` | Popover / dropdown / context menu / select content |
| `z-command` | `1100` | Command palette |
| `z-tooltip` | `1150` | Tooltip |
| `z-toast` | `1200` | Toasts |

### State-layer tokens

| Token | Value | Meaning |
| --- | --- | --- |
| `--state-hover` | `8%` | Overlay strength on hover |
| `--state-pressed` | `12%` | Overlay strength on press/active |
| `--state-selected` | `10%` | Overlay strength on selected/active items |

```css
@utility state-hover {
  &:hover,
  &:focus,
  &[data-highlighted],
  &[data-active='true'] {
    background-color: color-mix(in oklch, var(--foreground) var(--state-hover), transparent);
  }
}
```

State layers are transient overlays on interactive fills. They are not persistent
surface opacity (`bg-card/NN`, `bg-background/NN`), which remains banned.

### Typography, motion, and progressive enhancement

- Type utilities (`text-xs` ... `text-4xl`) carry design-system size +
  line-height. Prefer semantic roles (`type-display`, `type-title`,
  `type-heading`, `type-body`, `type-caption`, `type-label`) over ad hoc class
  combinations.
- Easing uses `ease-fluid` and `ease-snappy`; durations use
  `duration-(--duration-base)` or the other owned duration vars.
- CSS scroll-driven utilities are gated by `@supports (animation-timeline:
  view())` and reduced-motion: `scroll-fade-in`, `scroll-slide-up`,
  `scroll-parallax`.
- `withViewTransition()` wraps navigation when the View Transitions API exists
  and falls back to immediate navigation.
- Dark mode reduces body/headline weight and slightly increases body tracking to
  compensate for halation.

### Personalization

Runtime personalization rides the tier-2 semantic layer. `PersonalizationProvider`
writes `data-accent`, `data-glass`, and `data-density`; `PersonalizationScript`
must run before first paint. Accent values are `indigo`, `violet`, `rose`; glass
values are `soft`, `default`, `strong`; density values are `comfortable`,
`compact`.

### Adding a token

1. Add the raw value to the relevant scale in `tokens.css`.
2. Add/point a semantic alias in `theme.css` under both `:root` and `.dark`.
   Semantic tokens reference primitives; translucent tokens use
   `color-mix(in oklch, var(--primitive) N%, transparent)`.
3. Expose Tailwind utilities in the `@theme inline` block when needed.

### Adding a component

- Components live in `packages/ui/src/components/` and export from
  `packages/ui/src/index.ts`.
- Use `cva` variants, `data-slot` / `data-variant` styling hooks, Radix for
  interactive primitives, and `cn()` from `@pumni/ui`.
- Consume semantic tokens only. Floating layers use role-specific glass utility.
- Do not import app aliases (`@/`), `server-only`, Supabase, auth, env,
  validators, features, or test utilities.
- For standard shadcn primitives, run the CLI from `packages/ui`, then rewrite
  `@/lib/cn` to a relative import, replace raw colors with semantic tokens, keep
  data hooks, and add the barrel export by hand.

## Checklist

- [ ] Read `docs/conventions/design-system.md` (hard rules) first.
- [ ] No raw `oklch()`, primitive var, or Tailwind built-in palette in component classes.
- [ ] Surface is one of the closed-set roles; no `bg-{card,background,popover}/NN`.
- [ ] One `border-border`; status tint is the only `/20` border exception.
- [ ] Floating layer uses `GlassSurface`/`glass-*`; blur 8-16px only.
- [ ] Radius/z-index use named utilities; no `rounded-[Npx]`, no raw `z-40`/`z-50` for cross-component layers.
- [ ] Motion uses recipes / `motion-safe:` CSS; `useReducedMotion()` on JS motion.
- [ ] Contrast pairs resolved by `glass-contrast.test.ts` (APCA), not eyeballed.
- [ ] New component: `cva` variants, `data-slot` hooks, exported from `packages/ui/src/index.ts`, no `@/` or server imports.
- [ ] `bun run ai:check` passes.
