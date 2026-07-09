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
| Eyeballing contrast on glass/accents | Trust gated tokens; verify APCA Lc 60 (text on fill) | `glass-contrast` test owns the cascade |
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

**Surface identity = glassmorphism for floating layers (ADR-0012).** Optical
honesty: this is **engineered frosted glass** (blur + tint + specular), not Apple
Liquid Glass lensing/refraction (intentionally omitted on the web for GPU cost
and text clarity).

A glass surface is a frosted translucent fill tuned to the APCA **chrome / short-text**
gate (Lc 60 — *not* APCA body, which per APC-RC Bronze Simple Mode is **Lc 75 minimum
/ Lc 90 preferred** for fluent columns). The APCA reference is APC-RC Bronze Simple Mode
(`readtech.org/ARC/tests/bronze-simple-mode/`, `apca-w3` canonical npm); the
hand-roll in `packages/ui/src/lib/apca.ts` is drift-guarded against `apca-w3` in
`apca-canonical-drift.test.ts`. Two tint tiers derive from a
single fill source via CSS Color 5 relative syntax:

**Fill source (single L/C/H SSOT — CSS Color 5):**
```css
--glass-fill: light-dark(oklch(0.96 0.01 250), oklch(0.18 0.02 240));  /* no alpha */
```

**Apple HIG tier map** (HIG + Material 3 primary-source verification dates pinned in
ADR-0012 §B6 amendment; both vendor docs are JS-gated so they cannot be scraped —
verification is a dated manual checkpoint):

| Tier | Token | Apple analogue | APCA target | Content policy |
| --- | --- | --- | --- | --- |
| Chrome | `--glass-tint-chrome` | Clear-ish shell | Lc 60 short labels | Dock, topbar, titlebar, rails |
| Readable | `--glass-tint-readable` (`--glass-tint` alias) | Regular material | Lc 60 short UI | Panels, windows, menus, dialog chrome |
| Solid | `DialogBody` / `CardWell` / `bg-card` | Content layer | Lc 75+ body | Forms, tables, multi-line body |

**"readable" ≠ "body"** — the name means readable short-UI tier, not body text.

**Multi-line body copy must not sit on bare glass** — use `DialogBody`, `CardWell`,
or `bg-card` solid inset inside the glass shell (Apple HIG: glass = functional
chrome layer, not content).

**Alpha matrix** (chrome derives from fill; only alpha varies per intensity):

| Intensity | Mode | Chrome α | Readable α |
| --- | --- | --- | --- |
| default | light | 0.52 | 0.58 |
| default | dark | 0.34 | 0.40 |
| soft | light | 0.46 | 0.54 |
| soft | dark | 0.30 | 0.36 |
| strong | light | 0.58 | 0.65 |
| strong | dark | 0.40 | 0.48 |

All intensities pass APCA Lc 60 over desktop blobs and high-chroma synthetics
(`glass-contrast.test.ts` gates default + soft + strong, both modes).

> Superseded plans (`glassmorphism-2026-alignment.md`, `glassmorphism-2026-remediation.md`,
> `glass-border-doctrine-and-grain-2026.md`) are archived under `docs/plans/archive/`.
> Do not read them for design guidance — see ADR-0012 + this document.

Vibrancy uses `--glass-saturate` (≈1.3× light / 130% light / 150% dark) +
`--glass-brightness` (110% light / 85% dark). Blur ladder (soft / default / strong
personalization); the production span is **12–24px** (light default 16px, dark default 20px):

| Step | Token | Value |
| --- | --- | --- |
| soft | `--blur-glass-sm` | **12px** |
| default light | `--blur-glass` | **16px** |
| default dark | `--blur-glass-md` | **20px** |
| strong (cap) | `--blur-glass-lg` | **24px** |

Frosted choice over the 4–6px subtle web baseline; production cap 24px. Float depth is
the directional `--shadow-glass` — the **real delineator**. The border read
comes from `--surface-rim-top` (specular light inset) + the **specular light
`--glass-edge`**: a thin translucent light stroke that catches light along the
panel rim — white in light mode, softened to a light neutral-violet in dark
mode so it doesn't glow harsh. It is deliberately low-contrast and carries **no
APCA gate**: the glass edge is a light effect, not a readability boundary (WCAG
1.4.11 scopes contrast to interactive controls).
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
sRGB, which `apcaContrast` decodes) — **Lc 60 chrome/short-text** target for reading
surfaces, muted, and glass-over-blob (readable + chrome tiers, including
worst-case synthetic backdrops) in **both** modes, with documented pinned
floors below it only for accent surfaces (45) and status tints (per-token table
in the test; light warning and the dark destructive/primary chips sit lower
because those tokens double as solid fills). Long body columns should target
Lc 75+ on **solid** surfaces — not bare glass. When the brand/destructive colour
is needed AS page text (link button, `FormMessage`, error/eyebrow copy), use the
Step-11 text tokens `text-primary-text` / `text-destructive-text` — the base
`primary`/`destructive` are anchored dark for the solid-fill role and read at
only Lc ~34/37 as dark text. Do not add a WCAG 2.x ratio
gate. **WCAG 2.x AA bridge audit (non-gating):** `packages/ui/src/test/glass-wcag2-bridge.test.ts`
prints a WCAG 2.1 contrast report per gated surface pair in both modes — the legal
floor in jurisdictions that audit WCAG 2.x by statute — but never gates on it. The APCA
Lc gate stays authoritative (JND-aware; APCA correctly orders low-saturation text-on-glass
that WCAG 2.x under-counts). As of this revision the bridge logs one pair (light-mode
`muted-foreground` on `muted`) at WCAG 2.1 ≈ 4.35 — under AA 4.5 but at APCA Lc —66, well
above the Lc 60 floor: the floor is the gate, the bridge is the record. The rim tokens **and the glass edge** are specular light effects, NOT
subject to any APCA gate — the only APCA gate on glass is text over
`--glass-tint-readable` / chrome composites (Lc 60). Tune tint alphas / edges, never a
border-contrast threshold.

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
7. **Backdrop-root trap (MDN §backdrop-filter).** Never wrap a glass element
   in an ancestor carrying `opacity < 1`, `mix-blend-mode`, or
   `will-change: opacity|mix-blend-mode` — descendant `backdrop-filter` silently
   stops rendering. Glass / overlay opacity animation lives ON the glass element
   itself (flat string utilities `fade-in-0` / `fade-out-0` over
   `[data-state=open|closed]`). Guarded by
   `apps/web/src/test/design-system/glass-backdrop-root-trap.test.ts`.
8. **Accent Lc 45 ↔ font-size pairing (APCA Bronze Simple Mode).** Lc 45 (the
   accent-surface gate pinned in `glass-contrast.test.ts`) is the Bronze
   Simple Mode floor for **large/heavy** text — 24px / 700 or 36px / 400. A
   small accent chip label must therefore carry `≥ text-sm font-semibold`
   (14px / 600) or heavier. Raising the accent Lc floor above 45 lets the
   size floor drop commensurately; see `glass-accent-font-floor.test.ts`
   for the `fontLookupAPCA` per-weight px table surfaced from canonical
   `apca-w3`.

## Border consumption flow (ADR-0012)

"Border" is three distinct concepts — do not conflate them:

| Concept | Mechanism | Where it applies |
| --- | --- | --- |
| **Structural hairline** | `border: 1px solid var(--token)` — a real 1px edge | Card, CardWell, controls, glass |
| **Specular rim** | `inset 0 1px 0 0 var(--token)` box-shadow — a light effect, NOT a real border | Top/bottom lit edges of raised surfaces |
| **Status tint** | `border-{tone}/20` — state signalling | Badge, Card `state` |

**Closed set of structural hairline tokens, no others allowed** (ADR-0012):

- **Solid-flow**:
  - `--border` — dark, builds contrast against the fill. Card solid/inset, `CardWell`. The real delineator for solid surfaces.
  - `--input` — dark, one shade deeper than `--border`. Form controls only. Flat, no specular rim.
- **Glass-flow** — a specular **light rim**, not a contrast boundary (see the delineation doctrine below):
  - `--glass-edge` — uniform light rim (white in light mode, near-white neutral in dark), used by `glass-bar-bordered` and `glass-titlebar`.
  - `--glass-edge-top` / `--glass-edge-bottom` — bevel pair, painted by the masked 1px **gradient bevel ring** (`&::before`, 135° light-catch top-left → contact-shadow bottom-right) on `glass-panel` / `glass-window`. Per-side border colours were retired: CSS miters differently-coloured borders with a hard diagonal seam, which breaks the rim on rounded corners; the ring follows `border-radius` smoothly. The element keeps a transparent 1px metric border that a11y fallbacks re-colour. Light mode top: `oklch(1 0 0 / 0.65)` (white light-catch) and bottom: `oklch(0.4 0.02 260 / 0.14)` (faint cool shadow); dark mode top: `oklch(0.98 0.005 0 / 0.35)` (near-white neutral rim) and bottom: `oklch(0.2 0.01 250 / 0.15)` (subdued contact shadow). Neither stop is APCA-gated — the edge is a light effect, and the drop shadow is what delineates the panel.

### Delineation doctrine — the drop shadow separates, the edge catches light

A glass surface is separated from its backdrop by the **drop shadow**
(`--shadow-glass`), never by border contrast. The edge (`--glass-edge`, and
`--glass-edge-top` → `--glass-edge-bottom` on panels) is a **specular light
rim** — a thin translucent light stroke that catches light along the panel edge,
"visible enough to define the shape but light enough not to draw attention"
(2026 glassmorphism / Apple Liquid Glass consensus). It is deliberately
low-contrast, light in both modes (white in light, near-white neutral in dark).

**The glass edge is NOT APCA-gated.** No accessibility standard asks a container
border to hit a contrast ratio — WCAG 1.4.11 scopes contrast to *interactive
controls*, which is why `--input` (not the glass rim) carries that duty. The
only APCA gate on glass is **text over `--glass-tint-readable` / chrome composites** (Lc 60 chrome/short-text). An earlier
revision imposed an "Lc 25 delineation" floor on the dominant edge and inverted
the light-mode rim to a dark navy stroke to pass it; that made glass read like a
solid-card outline — the opposite of the material — so the floor was removed.
The real accessibility path for transparency is the system media-query fallbacks
(`prefers-contrast: more` / `prefers-reduced-transparency`), which recolour the
edge to a solid `--border`.

**`--surface-rim-top` is for chrome bars, titlebars, and inactive windows.** Active glass panels and windows consume `--glass-inset-bezel-top` as their top rim highlight instead. Inactive glass windows fall back to the bar-style `--surface-rim-top` inset top. Solid cards carry **no rim at all** — `--border` (hairline) + `--shadow-card-raised` (elevation) only. The bottom rim (`--glass-shadow-edge`) stays glass-only by design.

| | Solid card (`surface-raised`) | Glass card (`glass-panel`) |
| --- | --- | --- |
| Structural hairline | `--border` (dark) | Gradient bevel ring (masked `::before`): `--glass-edge-top` (light-catch) → `--glass-edge-bottom` (contact shadow); metric border transparent |
| Top rim | none (deliberate, ADR-0012) | `--glass-inset-bezel-top` |
| Bottom rim | none (deliberate) | `--glass-shadow-edge` |
| Real delineator | the hairline itself | `--shadow-glass` (drop shadow) |
| Edge/border APCA gate | none — `--border` is a structural hairline | none — the edge is a light effect; only text-on-readable/chrome tint is gated (Lc 60) |
| Hero specular | n/a | opt-in via `glass-panel[data-variant="specular"]` (conic shine layered on the SAME `::before` bevel ring — the boundary gradient stays visible underneath) |

**Decision tree** — pick the path that matches the element, never write a border
or inset rim in TSX:

```
GLASS panel/window (floats over a blob/media backdrop)?
  → Use glass-panel/window. edge = gradient bevel ring (--glass-edge-top →
    --glass-edge-bottom), rim pair = --glass-inset-bezel-top
    + --glass-shadow-edge, delineator = --shadow-glass. [glass.css owns this]
GLASS bar/titlebar (dock, topbar, title)?
  → Use glass-bar / glass-bar-bordered. hairline = --glass-edge, rim = --surface-rim-top
    [glass.css owns this]
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

### Extended glass token set (theme.css / tokens.css)

Beyond the surface identity tokens above, the glass system exposes these
additional CSS custom properties for chrome, specular effects, and backdrop:

**Shell chrome tokens** (glass-bar-edge-r / glass-bar-edge-b):
- `--glass-edge-rim` / `--glass-edge-rim-bottom` — directional inset offsets for
  sidebar/topbar/dock edge definition (`light-dark()`)
- `--shadow-shell-depth` / `--shadow-shell-depth-bottom` — directional edge
  shadows paired with the rim tokens

**Specular rim tokens** (hero specular variant on glass-panel):
- `--specular-rim-start` / `--specular-rim-mid` / `--specular-rim-end` —
  gradient stops for the conic specular shine layer on `glass-panel[data-variant="specular"]`

**Reflection overlay**:
- `--glass-reflection` — diagonal `linear-gradient(135deg)` overlay for the
  `glass-panel` / `glass-window` `::after` pseudo-element

**Tint tiers and fill source**:
- `--glass-fill` — single opaque L/C/H source (CSS Color 5, no alpha); light/dark via `light-dark()`
- `--glass-tint-chrome` — shell bars / titlebar (more translucent), derives via `oklch(from var(--glass-fill) l c h / α)`
- `--glass-tint-readable` — panels / windows / menus (`--glass-tint` alias), derives same fill

**Backdrop filter knobs**:
- `--glass-saturate` — base `130%` (light) / `150%` (dark)
- `--glass-brightness` — base `110%` (light) / `85%` (dark)
- `--blur-glass-sm` — `12px` (soft)
- `--blur-glass` — `16px` (default light)
- `--blur-glass-md` — `20px` (default dark)
- `--blur-glass-lg` — `24px` (strong / production cap)

**Shadow composition intermediaries**:
- `--shadow-glass-glow-base` — base glow layer composed into `--shadow-glass-glow`
- `--shadow-glass-glow-soft` — soft inactive glow (`glass-window[data-active='false']`)

**Backdrop colour context**:
- `--desktop-blob-primary` / `--desktop-blob-secondary` / `--desktop-blob-accent` / `--desktop-blob-cyan` — four blob colours for glass backdrop

**Fallback**:
- `--glass-bevel-ring-display` (default `block`) — toggle to `none` to hide the
  gradient bevel ring
- `--glass-fallback-bg` (`var(--popover)`) — opaque fallback for
  `prefers-reduced-transparency`
- `--glass-grain-opacity` — mode-dependent grain opacity (light `0.05` / dark `0.07`)

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
