# UI Styling — Reference

On-demand detail for the `ui-styling` skill. Load when you need an exact token,
surface role, radius/z-index value, or an add-token / add-component recipe. The
hard rules and completion checklist stay in `SKILL.md`.

## Contents

- [Semantic tokens](#semantic-tokens)
- [Surface vocabulary](#surface-vocabulary)
- [Radius scale](#radius-scale)
- [z-index scale](#z-index-scale)
- [State-layer tokens](#state-layer-tokens)
- [Glassmorphism details](#glassmorphism-details)
- [Border consumption and delineation doctrine](#border-consumption-and-delineation-doctrine)
- [Typography, motion, and progressive enhancement](#typography-motion-and-progressive-enhancement)
- [Personalization](#personalization)
- [Deriving an accessible foreground (inverse APCA)](#deriving-an-accessible-foreground-inverse-apca)
- [Adding a token](#adding-a-token)
- [Adding a component](#adding-a-component)

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
| `glass-tint` / `glass-edge` / `glass-edge-top/bottom` / `glass-inset-bezel-top` / `surface-rim-top` / `glass-shadow-edge` / `glass-blur` / `glass-saturate` / `glass-brightness` | Translucent glassmorphism surfaces. Glass panels/windows paint a masked 1px gradient bevel ring (`::before`, `--glass-edge-top` light-catch → `--glass-edge-bottom` contact shadow; a specular light rim, NOT contrast-gated — the drop shadow delineates; metric border transparent) + top bezel `--glass-inset-bezel-top` + bottom rim `--glass-shadow-edge`. Chrome bars consume `--glass-edge` + `--surface-rim-top`. `--surface-rim-top` also used on inactive windows. `--glass-fallback-bg` = opaque fallback; vibrancy via `--glass-saturate` (≈1.3× light / 130% light / 150% dark) + `--glass-brightness` (110% light / 85% dark); blur: `--blur-glass` 20px light / 24px dark, span **12–24px**. Perf: `will-change` scoped to overlay transitions; stacked glass ≤2 layers (each forces separate backdrop render pass — doc/skill rule). |
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
| Floating glass | `GlassSurface variant="panel\|bar\|window"` or the matching `glass-*` utility | Floating layers: dialogs, sheets, popovers, command palette, toast, topbar, dock, sidebar rail, OS windows, pills/overlays. Glassmorphism: frosted vibrant fill + luminous edge pair (`--glass-inset-bezel-top`/`--glass-shadow-edge` for panels/windows, or `--surface-rim-top` only for bars), tokenized `--glass-saturate` (≈1.3× light / 130% light / 150% dark) + `--glass-brightness` (110% light / 85% dark), directional `--shadow-glass`. **Must float over a colourful backdrop** (design-system.md): chrome glass over whatever sits behind it; feature/hero glass cards wrapped in 2-blob container. On flat backgrounds → use `Card variant="solid"`. Dense content (forms/tables) always solid. |
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

## Glassmorphism details

### Apple HIG / Material 3 tier map
(Verified 2026-07-09, next manual recheck: 2026-08-15)

| Tier | Token | Apple analogue | APCA target | Content policy |
| --- | --- | --- | --- | --- |
| Chrome | `--glass-tint-chrome` | Clear-ish shell | Lc 60 short labels | Dock, topbar, rails |
| Readable | `--glass-tint-readable` (`--glass-tint` alias) | Regular material | Lc 60 short UI | Panels, windows, menus, dialog chrome |
| Solid | `DialogBody` / `CardWell` / `bg-card` | Content layer | Lc 75+ body | Forms, tables, multi-line body |

**"readable" ≠ "body"** — the name means readable short-UI tier, not body text.
**Multi-line body copy must not sit on bare glass** — use `DialogBody`, `CardWell`, or `bg-card` solid inset inside the glass shell (Apple HIG: glass = functional chrome layer, not content).

### Alpha matrix
(chrome derives from fill; only alpha varies per intensity)

| Intensity | Mode | Chrome α | Readable α |
| --- | --- | --- | --- |
| default | light | 0.54 | 0.58 |
| default | dark | 0.34 | 0.40 |
| soft | light | 0.46 | 0.54 |
| soft | dark | 0.30 | 0.36 |
| strong | light | 0.58 | 0.65 |
| strong | dark | 0.40 | 0.48 |

All intensities pass APCA Lc 60 over desktop blobs and high-chroma synthetics (`glass-contrast.test.ts` gates default + soft + strong, both modes). Under accessibility higher-contrast preference (`prefers-contrast: more` or the in-app preview `data-contrast='more'`), both `--glass-tint-chrome` and `--glass-tint-readable` are densified to a near-opaque popover mix, and `--glass-tint` remains aliased to readable.

### Blur ladder and vibrancy
Vibrancy uses `--glass-saturate` (≈1.3× light / 130% light / 150% dark) + `--glass-brightness` (110% light / 85% dark). Blur ladder (soft / default / strong personalization); the production span is **12–24px** (light default 16px, dark default 20px):

| Step | Token | Value |
| --- | --- | --- |
| soft | `--blur-glass-sm` | **12px** |
| default light | `--blur-glass` | **16px** |
| default dark | `--blur-glass-md` | **20px** |
| strong (cap) | `--blur-glass-lg` | **24px** |

Frosted choice over the 4–6px subtle web baseline; production span 12–24px. Float depth is the directional `--shadow-glass` — the **real delineator**. The border read comes from `--surface-rim-top` (specular light inset) + the **specular light `--glass-edge`**: a thin translucent light stroke that catches light along the panel rim — white in light mode, softened to a light neutral-violet in dark mode so it doesn't glow harsh. It is deliberately low-contrast and carries **no APCA gate**: the glass edge is a light effect, not a readability boundary (WCAG 1.4.11 scopes contrast to interactive controls).

### APCA / WCAG-bridge detail
APCA contrast is gated per surface pair in `glass-contrast.test.ts` (spec-correct APCA: `oklchToSrgb` emits gamma-encoded sRGB, which `apcaContrast` decodes) — **Lc 60 chrome/short-text** target for reading surfaces, muted, and glass-over-blob (readable + chrome tiers, including worst-case synthetic backdrops) in **both** modes, with documented pinned floors below it only for accent surfaces (45) and status tints (per-token table in the test; light warning and the dark destructive/primary chips sit lower because those tokens double as solid fills). Long body columns should target Lc 75+ on **solid** surfaces — not bare glass. When the brand/destructive colour is needed AS page text (link button, `FormMessage`, error/eyebrow copy), use the Step-11 text tokens `text-primary-text` / `text-destructive-text` — the base `primary`/`destructive` are anchored dark for the solid-fill role and read at only Lc ~34/37 as dark text. Do not add a WCAG 2.x ratio gate. **WCAG 2.x AA bridge audit (non-gating):** `packages/ui/src/test/glass-wcag2-bridge.test.ts` prints a WCAG 2.1 contrast report per gated surface pair in both modes — the legal floor in jurisdictions that audit WCAG 2.x by statute — but never gates on it. The APCA Lc gate stays authoritative (JND-aware; APCA correctly orders low-saturation text-on-glass that WCAG 2.x under-counts). As of this revision the bridge logs one pair (light-mode `muted-foreground` on `muted`) at WCAG 2.1 ≈ 4.35 — under AA 4.5 but at APCA Lc —66, well above the Lc 60 floor: the floor is the gate, the bridge is the record. The rim tokens **and the glass edge** are specular light effects, NOT subject to any APCA gate — the only APCA gate on glass is text over `--glass-tint-readable` / chrome composites (Lc 60). Tune tint alphas / edges, never a border-contrast threshold.


## Border consumption and delineation doctrine

### Border concepts
"Border" is three distinct concepts — do not conflate them:

| Concept | Mechanism | Where it applies |
| --- | --- | --- |
| **Structural hairline** | `border: 1px solid var(--token)` — a real 1px edge | Card, CardWell, controls, glass |
| **Specular rim** | `inset 0 1px 0 0 var(--token)` box-shadow — a light effect, NOT a real border | Top/bottom lit edges of raised surfaces |
| **Status tint** | `border-{tone}/20` — state signalling | Badge, Card `state` |

### Structural hairline tokens (closed set)
(floating-only rule)

- **Solid-flow**:
  - `--border` — dark, builds contrast against the fill. Card solid/inset, `CardWell`. The real delineator for solid surfaces.
  - `--input` — dark, one shade deeper than `--border`. Form controls only. Flat, no specular rim.
- **Glass-flow** — a specular **light rim**, not a contrast boundary:
  - `--glass-edge` — uniform light rim (white in light mode, near-white neutral in dark), used by `glass-bar-bordered`.
  - `--glass-edge-top` / `--glass-edge-side` / `--glass-edge-bottom` — bevel stops, painted by the masked 1px **conic bevel ring** (`&::before`, symmetric conic specular model) on `glass-panel` / `glass-window`. Per-side border colours were retired: CSS miters differently-coloured borders with a hard diagonal seam, which breaks the rim on rounded corners; the ring follows `border-radius` smoothly. The element keeps a transparent 1px metric border that a11y fallbacks re-colour. Light mode: top `oklch(1 0 0 / 0.45)` (white light-catch), side `oklch(1 0 0 / 0.07)` (faint light), bottom `oklch(1 0 0 / 0.25)` (Fresnel catch); dark mode: top `oklch(0.98 0.005 0 / 0.28)`, side `oklch(0.98 0.005 0 / 0.05)`, bottom `oklch(0.98 0.005 0 / 0.15)`. Neither stop is APCA-gated — the edge is a light effect, and the drop shadow is what delineates the panel.

### Delineation doctrine
A glass surface is separated from its backdrop by the **drop shadow** (`--shadow-glass`), never by border contrast. The edge (`--glass-edge`, and `--glass-edge-top` → `--glass-edge-bottom` on panels) is a **specular light rim** — a thin translucent light stroke that catches light along the panel edge, "visible enough to define the shape but light enough not to draw attention" (2026 glassmorphism / Apple Liquid Glass consensus). It is deliberately low-contrast, light in both modes (white in light, near-white neutral in dark).

**The glass edge is NOT APCA-gated.** No accessibility standard asks a container border to hit a contrast ratio — WCAG 1.4.11 scopes contrast to *interactive controls*, which is why `--input` (not the glass rim) carries that duty. The only APCA gate on glass is **text over `--glass-tint-readable` / chrome composites** (Lc 60 chrome/short-text). An earlier revision imposed an "Lc 25 delineation" floor on the dominant edge and inverted the light-mode rim to a dark navy stroke to pass it; that made glass read like a solid-card outline — the opposite of the material — so the floor was removed. The real accessibility path for transparency is the system media-query fallbacks (`prefers-contrast: more` / `prefers-reduced-transparency`), which recolour the edge to a solid `--border`.

`--surface-rim-top` is for chrome bars and inactive windows. Active glass panels and windows consume `--glass-inset-bezel-top` as their top rim highlight instead. Inactive glass windows fall back to the bar-style `--surface-rim-top` inset top. Solid cards carry **no rim at all** — `--border` (hairline) + `--shadow-card-raised` (elevation) only. The bottom rim (`--glass-shadow-edge`) stays glass-only by design.

### Solid vs Glass comparison

| | Solid card (`surface-raised`) | Glass card (`glass-panel`) |
| --- | --- | --- |
| Structural hairline | `--border` (dark) | Conic bevel ring (masked `::before`): symmetric conic specular model with top / side / bottom catches; metric border transparent |
| Top rim | none (deliberate) | `--glass-inset-bezel-top` |
| Bottom rim | none (deliberate) | `--shadow-glass-glow` / `--glass-shadow-edge` |
| Real delineator | the hairline itself | `--shadow-glass` (drop shadow) |
| Edge/border APCA gate | none — `--border` is a structural hairline | none — the edge is a light effect; only text-on-readable/chrome tint is gated (Lc 60) |


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

The APCA gate lives in `glass-contrast.test.ts` (spec-correct APCA: gamma-encoded
sRGB into `apcaContrast`). The floor table the gate enforces:

| Surface / target text | Lc floor | Notes |
|---|---|---|
| Chrome / short text on surfaces, muted, glass-over-blob | **60** | Both modes; readable + chrome tiers |
| Long body text | **75+** preferred | On a solid surface — never multi-line body on bare glass (`DialogBody` / `CardWell`) |
| Accent surfaces | **45** | Pinned floor below 60; explicitly documented |
| Status tints | per-token | See `packages/ui/src/test/glass-contrast.test.ts` |
| Glass border (edge) | **not gated** | Specular light rim; delineation is `--shadow-glass`; a11y path is `prefers-contrast` / `prefers-reduced-transparency`; **no WCAG 2.x ratio gate**, never gate the glass border on contrast |

**Accent Lc 45 ↔ font-size pairing (APCA Bronze Simple Mode)**
Lc 45 is the accent-surface gate floor pinned in `glass-contrast.test.ts` for accent-foreground on the accent surface. This is the Bronze Simple Mode floor for **large/heavy** text — 24px / 700 or 36px / 400 — NOT for normal-size body or chrome labels. Pumni's accent fills are short label surfaces. To keep accent chip text in the Bold/Lc-45 envelope, the design-system requires chip text to be $\ge$ `text-sm font-semibold` (14px/600) or heavier. Raising the accent Lc floor above 45 drops the size floor commensurately; see `glass-accent-font-floor.test.ts` for the `fontLookupAPCA` per-weight px table.

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
