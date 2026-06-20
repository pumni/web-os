# UI Styling — Reference

On-demand detail for the `ui-styling` skill. Load when you need an exact token,
surface role, radius/z-index value, or an add-token / add-component recipe. The
hard rules and completion checklist stay in `SKILL.md`.

## Semantic tokens

| Token | Role |
| --- | --- |
| `background` / `foreground` | Page surface + default text |
| `card` / `popover` (+ `-foreground`) | Card defaults to a solid raised surface; glass is opt-in for floating cards; inset is the recessed well. |
| `primary` (+ `-foreground`) | Brand actions |
| `secondary` / `muted` / `accent` (+ `-foreground`) | Subdued + hover surfaces |
| `destructive` / `success` / `warning` (+ `-foreground`) | Status |
| `border` / `input` / `field` / `ring` | Hairlines, fields, input backdrops, focus ring |
| `glass-bg` / `glass-border` / `glass-highlight` / `glass-shadow-edge` / `glass-sheen` / `glass-scrim` / `glass-blur` | Translucent glassmorphism surfaces. `glass-highlight`/`glass-shadow-edge` = the luminous edge pair (inset box-shadows, NOT APCA-gated); `glass-sheen` = inner `background-image` gradient (not gate-read); vibrancy is the single `--glass-saturate` knob (≈1.4). |
| `overlay` | Modal / sheet / command-palette scrim (`bg-overlay`) |
| `brand-gradient-*` | Brand gradient stops for display text only |
| `desktop-blob-*` | Decorative OS wallpaper ambience |
| `chart-1` ... `chart-5` | Data-visualization series colors |

Primitive color variables (`--indigo-*`, `--violet-*`, `--neutral-*`, status
scales, and raw `oklch(...)`) are restricted to token/theme files.

## Surface vocabulary

| Role | How to build it | Use for |
| --- | --- | --- |
| Floating glass | `GlassSurface variant="panel\|bar\|window\|titlebar"` or the matching `glass-*` utility | Floating layers: dialogs, sheets, popovers, command palette, toast, topbar, dock, sidebar rail, OS windows, pills/overlays. Glassmorphism: frosted vibrant fill + luminous edge pair (`--glass-highlight`/`--glass-shadow-edge`) + inner sheen (`--glass-sheen`), tokenized `--glass-saturate`, directional `--shadow-glass`. Only reads over a backdrop. |
| Solid card | `<Card>` / `variant="solid"` -> `border bg-card surface-raised rounded-xl` | Primary content surfaces. `surface-raised` = `--shadow-card-raised` + `--card-rim-top` lit edge (NOT flat). |
| Inset well | `<CardWell>` (or `<Card variant="inset">`) — never hand-roll `border bg-muted` (`pumniNoAdHocSurface` blocks it) | Nested wells inside cards: stat tiles, list rows, scroll wells. `radius` md/lg/xl, `padding` none/sm/md/lg. |
| Control fill | `bg-muted` plus `motion-safe:hover:bg-muted/80` | Small inline controls: tabs, chips, code pills |
| Status tint | `<Badge tone="...">` (`neutral\|primary\|success\|warning\|destructive`, optional `pulse` dot) | Inline status chips/banners — the owned status-tint pill. |
| Icon chip | `<IconBadge tone="primary-soft\|raised\|muted" size="sm\|md\|lg\|xl">` | The rounded icon container on cards/tiles/empty states. |

## Radius scale

| Utility | Value at base 10px | Typical use |
| --- | --- | --- |
| `rounded-xs` | 4px | Checkboxes, tiny indicators, tooltip arrow |
| `rounded-sm` | 6px | Menu items, inline chips |
| `rounded-md` | 8px | Buttons, inputs, dropdown/menu content |
| `rounded-lg` | 10px | Dialogs |
| `rounded-xl` | 14px | Cards, windows, sheets, command palette |
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
must run before first paint. Accent values are `indigo`, `violet`, `rose`; glass
values are `soft`, `default`, `strong`; density values are `comfortable`,
`compact`.

## Adding a token

1. Add the raw value to the relevant scale in `tokens.css`.
2. Add/point a semantic alias in `theme.css` under both `:root` and `.dark`.
   Semantic tokens reference primitives; translucent tokens use
   `color-mix(in oklch, var(--primitive) N%, transparent)`.
3. Expose Tailwind utilities in the `@theme inline` block when needed.

## Adding a component

- Components live in `packages/ui/src/components/`, grouped by functional role:
  `form/`, `overlay/`, `layout/`, `feedback/`, `identity/`, or `os/` (see
  `packages/ui/AGENTS.md`). Export from `packages/ui/src/index.ts`.
- Use `cva` variants, `data-slot` / `data-variant` styling hooks, Radix for
  interactive primitives, and `cn()` from `@pumni/ui`.
- Consume semantic tokens only. Floating layers use role-specific glass utility.
- Do not import app aliases (`@/`), `server-only`, Supabase, auth, env,
  validators, features, or test utilities.
- For standard shadcn primitives, run the CLI from `packages/ui`, then rewrite
  `@/lib/cn` to a relative import (`../../lib/cn` from inside a group folder),
  replace raw colors with semantic tokens, keep data hooks, move the file into
  the right group folder, and add the barrel export by hand.
