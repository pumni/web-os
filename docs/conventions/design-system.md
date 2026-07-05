---
description: Pumni OS design system hard rules for tokens, surfaces, contrast, motion, and @pumni/ui. Use when styling UI, adding design tokens, building components, or deciding whether to load `.agents/skills/ui-styling/SKILL.md` for reference tables.
---

# Pumni OS Design System

Pumni Web OS is token-first: OKLCH primitives feed semantic roles; components
consume semantic utilities only. Reference tables and recipes live in
`.agents/skills/ui-styling/SKILL.md`.

Token source of truth lives in `@pumni/ui`:

- `packages/ui/src/styles/tokens.css`
- `packages/ui/src/styles/brand.css`
- `packages/ui/src/styles/theme.css`
- `packages/ui/src/styles/component-tokens.css`
- `packages/ui/src/styles/glass.css`

These are imported once in `apps/web/src/app/globals.css`.

## Brand contract (project override surface)

`brand.css` is the **one place a consuming project rebrands the platform**
(ADR-0010). The semantic layer reads `--brand-primary` / `--brand-ring` /
`--brand-gradient-*` (a warm coral/clay by default) instead of pointing at
primitives, so a new project changes identity by overriding `--brand-*` — at
`:root` or a project-scoped selector imported after the `@pumni/ui` styles —
without editing core. This is the entry surface of the semantic tier, **not a
fourth tier**. The coral brand splits its stop per theme (light uses the deeper
`coral-600`, dark the lighter `coral-500`) so the white `--primary-foreground`
clears the APCA gate in both — a literal book-cloth coral (L≈0.64) would fail
it; a wide-gamut `@media (color-gamut: p3)` block lifts only chroma for a richer
clay on capable displays while the sRGB values stay the gated authority. When
overriding, keep enough lightness that white foreground clears the
`glass-contrast` gate. The named accents in `personalization.css` (coral / cyan
/ indigo / violet / rose) stay literal (a runtime user palette, not the brand);
cyan — the former default — is now one of those selectable accents.

To derive an accessible foreground for an overridden brand colour (instead of
hand-tuning), use `foregroundFor(bg, targetLc)` / `backgroundFor` from
`@pumni/ui` (`packages/ui/src/lib/apca.ts`). It binary-searches the OKLCH
lightness axis with the same `apcaContrast` the gate uses — Lc 60 for body text,
Lc 25 for UI edges — and reports `reachedTarget: false` when a colour cannot
host the target (e.g. no neutral text reaches Lc 60 over a mid-tone ~0.7
surface — the APCA dead zone).

## Anti-slop guardrails (read first)

| Don't (generic slop) | Do (Pumni) | Why |
| --- | --- | --- |
| `bg-neutral-900`, `text-white`, raw `oklch(...)` | Semantic utilities: `bg-card`, `text-muted-foreground` | `pumniNoRawColor` ESLint rule blocks it |
| `bg-black/40` for scrims | `bg-overlay` | One owned scrim token, theme-aware |
| `rounded-[14px]`, `rounded-2xl` everywhere | Named radius utilities off `--radius-base` | One personalizable knob, not magic px |
| `ease-out`, `duration-300` | `ease-fluid` / `ease-snappy`; `duration-(--duration-base)` | Brand curves + owned timing (`pumniNoRawTiming` blocks it) |
| Hand-rolled `whileHover={{ scale: 1.05 }}` | `recipes.hoverLift` / `pressScale` / `staggerItem` from `@pumni/ui` | One motion vocabulary, drift-tested |
| Glass on hero / page backgrounds, or glass cards on flat surfaces | Glass only on floating layers with a colourful backdrop (ADR-0012); opaque shell + raised solid cards. Dense content (forms/tables) always uses solid | `backdrop-filter` is GPU-heavy; glassmorphism reads only over a backdrop |
| Eyeballing contrast on glass/accents | Trust gated tokens; verify APCA Lc 60 / Lc 25 | `glass-contrast` test owns the cascade |
| `backdrop-blur-md` | Glass utility / `GlassSurface` | Reduced-transparency and performance fallbacks |
| `bg-card/40`, `border-border/20` | Solid surface tokens: opaque, `border-border` | Surfaces are opaque in the unified system |
| `shadow-md`, `shadow-lg` on content | `shadow-card` / `shadow-raised` | One elevation ladder |
| Hand-rolled `rounded-lg border bg-muted` inset well, inline status pill, icon chip | `CardWell`, `Badge`, `IconBadge` from `@pumni/ui` | Closed card sub-surface set; `pumniNoAdHocSurface` blocks the shorthand well |

## Token tiers (do not exceed three)

1. **Primitive** (`tokens.css`) — raw OKLCH values and scales. Never consumed
   directly by components.
2. **Semantic / alias** (`theme.css`) — UI roles that reference primitives and
   switch per theme. This is the only layer components read.
3. **Component** (`component-tokens.css`) — narrow, scoped vars for real local theming. Reference
   semantics.

Apps consume semantic utilities, not primitives. Color tokens must default to the `light-dark()` function defined at `:root` in `theme.css` / `brand.css` / `component-tokens.css`, rather than duplicating declarations in separate `.dark` override blocks. The `.dark` block is reserved for non-color overrides (such as shadow lists, blurs, and typographic weights).

## Surface utilities and overlay roles

Glass is reserved for floating layers: Dialog, Sheet, Popover, DropdownMenu,
ContextMenu, Command palette, Toast, Topbar, Dock, Sidebar rail, OS
`Window`/titlebar, and small floating pills/overlays. Large backgrounds and flat
shell surfaces stay opaque.

**Surface identity = glassmorphism for floating layers (ADR-0012).** A glass surface is a frosted translucent fill
(`--glass-tint`) tuned to the APCA gate edge, with: a **luminous light top edge +
dark bottom edge** (`--surface-rim-top` / `--glass-shadow-edge`, inset box-shadows
in the `glass-*` utilities) and **vibrancy** via the single `--glass-saturate`
knob (≈1.4; the `glass-saturate.test.ts` guard locks the tokenization, not the
value). Blur is frosted (`--blur-glass` 8–16px; dark uses 16px) — a deliberate
"frosted" choice over the 2026 subtle baseline of 4–6px (UX Pilot 2026),
recorded as such by the ADR-0012 2026-07-04 amendment. Float depth is
the directional `--shadow-glass`. The border read comes from
`--surface-rim-top` (specular light inset) + the **mode-inverted
`--glass-edge`** (2026-07-04 alignment): light mode carries a dark
neutral-blue rim and dark mode a light neutral-violet rim. A
pure-white edge would composite with the white `--glass-tint` in light
mode and lose all APCA contrast on a bright backdrop, so the edge is
dark-on-light / light-on-dark — the opposite of the prior uniform
white hairline. The glass border is now APCA-gated at Lc 25 in both
modes.
**Perf discipline:** `will-change` is scoped to overlay transitions only
(`[data-state=open|closed]`); stacked glass is capped at 2 layers (each layer
forces a separate backdrop render pass — a doc/skill rule).
Solid cards are NOT glass — they carry real elevation via `surface-raised`
(`--shadow-card-raised` only); content stays solid, glass is only for floating
layers (it earns its `backdrop-filter` cost there). Solid surfaces are
**structural-only** (ADR-0012): `--border` hairline + elevation shadow, no
specular rim — the luminous top rim (`--surface-rim-top`) is **glass-only**, so a solid card reads crisp and structural
while glass reads luminous and floating. The OS
`Window`/Dock are presentational chrome: window controls rest neutral (`bg-border`) and take semantic status colours (`destructive`/`warning`/`success`) only on the active window — no literal macOS palette.

**Backdrop requirement (ADR-0012).** A glass surface only reads as
glassmorphism when it has a colourful backdrop to refract — desktop blobs, media,
or a scrim overlay. Two valid patterns: (1) *chrome glass* — overlays and system
shells that sit over whatever is behind them (dialogs, sheets, popovers, topbar,
dock); (2) *feature/hero glass cards* — decorative glass cards explicitly
wrapped in a 2-blob container (`--desktop-blob-primary` /
`--desktop-blob-secondary`, each `opacity-50/55 blur-3xl`, with a `bg-muted/30`
scrim). On a flat solid background, glass collapses to a grey box and must be
replaced with `Card variant="solid"`. Dense content (forms, tables, long text)
always uses solid regardless of backdrop.

Use the closed set from the skill: floating glass, solid card, inset well,
control fill, status tint. The card layer is **composition-first** — `Card` is
the block surface (variants `solid`/`inset`/`glass`/`spotlight`), and three
sub-surface primitives keep consumers from hand-rolling surfaces: `CardWell`
(the recessed `border border-border bg-muted` inset well), `Badge` (the
status-tint pill, `tone` + optional `pulse` dot), and `IconBadge` (the rounded
icon chip, `tone` `primary-soft`/`raised`/`muted`). `BentoGridItem` owns layout
only and renders through these same primitives, so a bento tile and a feature
card share one surface vocabulary. APCA contrast is gated per surface pair in
`glass-contrast.test.ts` (spec-correct APCA: `oklchToSrgb` emits gamma-encoded
sRGB, which `apcaContrast` decodes) — Lc 60 body-text target for reading
surfaces, muted, and glass-over-blob in **both** modes, with documented pinned
floors below it only for accent surfaces (45) and status tints (per-token table
in the test; light warning and the dark destructive/primary chips sit lower
because those tokens double as solid fills). When the brand/destructive colour
is needed AS page text (link button, `FormMessage`, error/eyebrow copy), use the
Step-11 text tokens `text-primary-text` / `text-destructive-text` — the base
`primary`/`destructive` are anchored dark for the solid-fill role and read at
only Lc ~34/37 as dark text. Do not add a WCAG 2.x ratio
gate. The rim tokens are specular (inset shadows) and are NOT subject to the
APCA gate — tune `--glass-tint` / `--glass-edge`, never the thresholds.

**Hard rules:**

1. No raw `backdrop-blur-*` in component TSX. Blur comes from `glass-*` utilities
   or `GlassSurface`.
2. No surface-token opacity: no `bg-card/NN`, `bg-background/NN`,
   `bg-popover/NN`. Surfaces are opaque except hover-only `bg-muted/80`.
3. One border: `border-border`. Delete `border-border/NN` except status
   indicators.
4. No raw elevation shadows (`shadow-lg`, `shadow-xl`, `shadow-2xl`). Content
   uses owned elevation; floating depth comes from `glass-*`.
5. Radius via named utilities only (`rounded-md/lg/xl`, `rounded-full`). No
   `rounded-[Npx]`.
6. No new color tokens. Reuse existing semantic tokens.

## Border consumption flow (ADR-0012)

"Border" is three distinct concepts — do not conflate them:

| Concept | Mechanism | Where it applies |
| --- | --- | --- |
| **Structural hairline** | `border: 1px solid var(--token)` — a real 1px edge | Card, CardWell, controls, glass |
| **Specular rim** | `inset 0 1px 0 0 var(--token)` box-shadow — a light effect, NOT a real border | Top/bottom lit edges of raised surfaces |
| **Status tint** | `border-{tone}/20` — state signalling | Badge, Card `state` |

**Three structural hairline tokens, no fourth** (ADR-0012):

- `--border` — dark, builds contrast against the fill. Card solid/inset,
  `CardWell`. The real delineator for solid surfaces.
- `--input` — dark, one shade deeper than `--border`. Form controls only. Flat,
  no specular rim.
- `--glass-edge` — **mode-inverted** (2026-07-04 alignment): light
  `oklch(0.3 0.02 260 / 0.40)` dark neutral-blue rim (a pure-white edge
  composites with the white `--glass-tint` and loses all APCA contrast
  on a bright blob); dark `oklch(0.9 0.03 270 / 0.50)` light neutral-
  violet rim (softer than pure white so it doesn't glow harsh against
  dark). Both clear APCA Lc 25 over the worst-case amber/coral blob.
  Glass surfaces only. On glass the *structural* hairline is specular;
  the **drop shadow** (`--shadow-glass`) is the real delineator.

**`--surface-rim-top` is glass-only (ADR-0012).** Solid cards carry
**no rim at all** — `--border` (hairline) + `--shadow-card-raised` (elevation)
only. The bottom rim (`--glass-shadow-edge`) stays glass-only by design.

| | Solid card (`surface-raised`) | Glass card (`glass-panel`) |
| --- | --- | --- |
| Structural hairline | `--border` (dark) | `--glass-edge` (mode-inverted: light=dark neutral-blue, dark=light neutral-violet) |
| Top rim | none (deliberate, ADR-0012) | `--surface-rim-top` |
| Bottom rim | none (deliberate) | `--glass-shadow-edge` |
| Real delineator | the hairline itself | `--shadow-glass` (drop shadow) |
| APCA Lc 25 gate | enforced | enforced (2026-07-04 alignment; was exempt before) |
| Hero specular | n/a | opt-in via `glass-panel[data-variant="specular"]` |

**Decision tree** — pick the path that matches the element, never write a border
or inset rim in TSX:

```
GLASS surface (floats over a blob/media backdrop)?
  → Use a glass-* utility. hairline = --glass-edge, rim pair = --surface-rim-top
    + --glass-shadow-edge, delineator = --shadow-glass. [glass.css owns this]
SOLID surface (content card, well)?
  → Card variant="solid" / CardWell. hairline = --border, no top rim
    (structural-only, ADR-0012 — surface-raised has no specular rim),
    no bottom rim. [no inset rim in TSX]
FORM CONTROL (input, button, select)?
  → --input. No specular rim. aria-invalid → border-destructive.
STATUS INDICATOR (badge, error/success card)?
  → border-{tone}/20 via Badge or Card state — the one valid /20 exception.
SHELL CHROME (sidebar rail, topbar, dock)?
  → glass-bar / glass-bar-edge-r/b. vertical rim = --glass-edge-rim. [no 4-sided border]
```

**Golden rules:**

1. Never write `border: 1px solid <colour>` or an inset rim box-shadow in TSX —
   go through a utility (`glass-*`, `surface-raised`) or component (`Card`,
   `CardWell`, `Badge`).
2. Status tint `/20` is reached **only** via `Badge` or `Card state`. No
   hand-rolled `border-{tone}/20`, no `border-2`, no `border-l-4` in features.

The solid-vs-glass hairline separation is pinned by the `border-consumption`
drift guard (`packages/ui/src/test/border-consumption.test.ts`).

## Tailwind v4 variant syntax (canonical form)

This repo is **Tailwind v4**. Most AI training data is v3, where bare
attribute variants did not exist — so models emit the verbose v3 form by
default. Prefer the v4 canonical shorthand.

Enforced in CI via `tailwind-lint` (the Tailwind language-service `suggestCanonicalClasses`
diagnostic, run headless): `bun run ai:tw` checks (part of `bun run ai:check`)
and `bun run ai:tw -- --fix` rewrites the whole repo in one pass.

## State-layer tokens

`--state-hover`, `--state-pressed`, and `--state-selected` are transient
interactive overlays. They are allowed on controls and are distinct from banned
persistent surface opacity. See `.agents/skills/ui-styling/SKILL.md` for values
and the `color-mix()` recipe.

## Reference detail

Load `.agents/skills/ui-styling/SKILL.md` for semantic token tables, surface
vocabulary, APCA detail, radius/z-index tables, motion, personalization,
visual-regression notes, or add-token/component recipes.
