# UI Styling — Reference

On-demand detail for the `ui-styling` skill. Load when you need an exact token,
surface role, radius/z-index value, or an add-token / add-component recipe. The
hard rules and completion checklist stay in `SKILL.md`.

## Semantic tokens

| Token | Role |
| --- | --- |
| `background` / `foreground` | Page surface + default text |
| `card` / `popover` (+ `-foreground`) | Card defaults to a solid raised surface; glass is opt-in for floating cards; inset is the recessed well. |
| `primary` (+ `-foreground`) | Brand actions. `-foreground` = text placed ON the primary fill. |
| `primary-text` / `destructive-text` | Step-11 TEXT role. Use `text-primary-text` / `text-destructive-text` when the brand/destructive colour is the text ON a page/card surface (link button, `FormMessage`, error/eyebrow copy) — NOT `text-primary`/`text-destructive`, which are anchored dark for their solid-fill role (Lc ~34/37 as dark text). Light = the base token; dark lifts to a readable stop via relative OKLCH. Gated at Lc 60 in `glass-contrast.test.ts`. |
| `secondary` / `muted` / `accent` (+ `-foreground`) | Subdued + hover surfaces |
| `destructive` / `success` / `warning` (+ `-foreground`) | Status |
| `border` / `input` / `field` / `ring` | Hairlines, fields, input backdrops, focus ring |
| `glass-tint` / `glass-edge` / `glass-edge-top/bottom` / `glass-inset-bezel-top` / `surface-rim-top` / `glass-shadow-edge` / `glass-blur` / `glass-grain-opacity` / `glass-reflection` / `glass-saturate` / `glass-brightness` | Translucent glassmorphism surfaces. Glass panels/windows paint a masked 1px gradient bevel ring (`::before`, `--glass-edge-top` light-catch → `--glass-edge-bottom` contact shadow; a specular light rim, NOT contrast-gated — the drop shadow delineates; metric border transparent) + top bezel `--glass-inset-bezel-top` + bottom rim `--glass-shadow-edge` + diagonal reflection (`--glass-reflection`). Chrome bars/titlebars consume `--glass-edge` + `--surface-rim-top`. `--surface-rim-top` also used on inactive windows. Grain overlay (`glass-grain` `::after` with `mix-blend-mode: overlay`) is on `glass-panel-simple` only, not on `glass-panel`/`glass-window`. `--glass-grain-opacity` (light 0.05 / dark 0.07). `--glass-fallback-bg` = opaque fallback; vibrancy via `--glass-saturate` (≈1.3× light / 130% light / 150% dark) + `--glass-brightness` (110% light / 85% dark); blur: `--blur-glass` 20px light / 24px dark, span **12–24px**. Perf: `will-change` scoped to overlay transitions; stacked glass ≤2 layers (each forces separate backdrop render pass — doc/skill rule). |
| `overlay` | Modal / sheet / command-palette scrim (`bg-overlay`) |
| `brand-gradient-*` | Brand gradient stops for display text only |
| `desktop-blob-*` | Decorative OS wallpaper ambience |
| `chart` | Legacy single data-visualization series color (indigo); alias for `--chart-2`. |
| `chart-1` ... `chart-5` | Five semantic, CVD-safe chart colors with guaranteed APCA Lc 45 contrast over background and card surfaces. `--chart-1` follows the personalization accent; 2–5 stay fixed (Indigo, Cyan, Amber, Violet). |

Primitive color variables (`--indigo-*`, `--violet-*`, `--neutral-*`, status
scales, and raw `oklch(...)`) are restricted to token/theme files.

## Surface vocabulary

| Role | How to build it | Use for |
| --- | --- | --- |
| Floating glass | `GlassSurface variant="panel\|bar\|window\|titlebar"` or the matching `glass-*` utility | Floating layers: dialogs, sheets, popovers, command palette, toast, topbar, dock, sidebar rail, OS windows, pills/overlays. Glassmorphism: frosted vibrant fill + luminous edge pair (`--glass-inset-bezel-top`/`--glass-shadow-edge` for panels/windows, or `--surface-rim-top` only for bars), tokenized `--glass-saturate` (≈1.3× light / 130% light / 150% dark) + `--glass-brightness` (110% light / 85% dark), directional `--shadow-glass`. **Must float over a colourful backdrop** (design-system.md): chrome glass over whatever sits behind it; feature/hero glass cards wrapped in 2-blob container. On flat backgrounds → use `Card variant="solid"`. Dense content (forms/tables) always solid. |
| Solid card | `<Card>` / `variant="solid"` -> `border bg-card surface-raised rounded-xl` | Primary content surfaces. `surface-raised` = `--shadow-card-raised` only (structural, NO specular rim — the rim is glass-only). |
| Inset well | `<CardWell>` (or `<Card variant="inset">`) — never hand-roll `border bg-muted` (`pumniNoAdHocSurface` blocks it) | Nested wells inside cards: stat tiles, list rows, scroll wells. `radius` md/lg/xl, `padding` none/sm/md/lg. |
| Control fill | `bg-muted` plus `motion-safe:hover:bg-muted/80` | Small inline controls: tabs, chips, code pills |
| Status tint | `<Badge tone="...">` (`neutral\|primary\|success\|warning\|destructive`, optional `pulse` dot) | Inline status chips/banners — the owned status-tint pill. |
| Icon chip | `<IconBadge tone="primary-soft\|raised\|muted" size="sm\|md\|lg\|xl">` | The rounded icon container on cards/tiles/empty states. |

## Radius scale

| Utility | Value at base 10px | Typical use |
| --- | --- | --- |
| `rounded-xs` | 4px | Checkboxes, tiny indicators, tooltip arrow |
| `rounded-sm` | 6px | Menu items, inline chips |
| `rounded-md` | 8px | Buttons, inputs, tooltips |
| `rounded-lg` | 10px | Popover/menu/select content, toasts (concentric: `p-1` panel + `rounded-sm` items) |
| `rounded-xl` | 14px | Cards, windows, dialogs, sheets (inner edge), command palette |
| `rounded-2xl` / `rounded-3xl` | 18px / 26px | Large hero surfaces |

## z-index scale

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

## State-layer tokens

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

## Typography, motion, and progressive enhancement

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

## Personalization

Runtime personalization rides the tier-2 semantic layer. `PersonalizationProvider`
writes `data-accent`, `data-glass`, and `data-density`; `PersonalizationScript`
must run before first paint. Accent values are `coral`, `cyan`, `indigo`,
`violet`, `rose` (`coral` is the brand default); glass values are `soft`,
`default`, `strong`; density values are `comfortable`, `compact`.

## Deriving an accessible foreground (inverse APCA)

Don't hand-tune contrast for an overridden brand colour — derive it. `apca.ts`
(`packages/ui/src/lib/apca.ts`) bisects the OKLCH lightness axis with the same
`apcaContrast` the gate uses, so the result clears the gate by construction.

```ts
import { foregroundFor, backgroundFor } from '@pumni/ui'; // lib/apca

// least-extreme text colour over a brand surface that hits Lc 60 (body) / Lc 25 (UI)
const fg = foregroundFor({ l: 0.64, c: 0.14, h: 40 }, 60, { polarity: 'auto' });
// → { oklch, l, c, h, lc, reachedTarget }
fg.oklch;          // drop straight into a CSS token
fg.reachedTarget;  // false when no colour over this surface can reach the target
```

- `targetLc`: **60** body text, **45** large text, **25** UI edges/chrome.
- `polarity`: `'auto'` picks the readable side by contrast *capacity* (correct for
  mid-lightness anchors, where `L ≥ 0.5` guesses wrong); force with
  `'lighter'`/`'darker'`.
- `chroma`/`hue` default to `0` (neutral → always in sRGB gamut); raise only when
  you need a tinted foreground and accept gamut risk.
- `backgroundFor(fg, targetLc)` is the dual — derive the least-tinted surface
  under a fixed text colour.

This is the sanctioned path behind ADR-0010 brand overrides; the live playground
is the `apca` design-system page (`features/design-system/components/apca-section.tsx`).

## Adding a token

1. Add the raw value to the relevant scale in `tokens.css`.
2. Add/point a semantic alias in `theme.css` under both `:root` and `.dark`.
   Semantic tokens reference primitives; translucent tokens use
   `color-mix(in oklch, var(--primitive) N%, transparent)`.
3. Expose Tailwind utilities in the `@theme inline` block when needed.

## Adding a component

- Components live in `packages/ui/src/components/`, grouped by functional role:
  `form/`, `overlay/`, `layout/`, `feedback/`, `identity/`, or `os/` (see
  `packages/ui/AGENTS.md`). Export from the role barrel, e.g.
  `packages/ui/src/components/form/index.ts`.
- Use `cva` variants, `data-slot` / `data-variant` styling hooks, Radix for
  interactive primitives, and `cn()` from `@pumni/ui`.
- Consume semantic tokens only. Floating layers use role-specific glass utility.
- Do not import app aliases (`@/`), `server-only`, Supabase, auth, env,
  validators, features, or test utilities.
- For standard shadcn primitives, run the CLI from `packages/ui`, then rewrite
  `@/lib/cn` to a relative import (`../../lib/cn` from inside a group folder),
  replace raw colors with semantic tokens, keep data hooks, move the file into
  the right group folder, and add the barrel export by hand.
