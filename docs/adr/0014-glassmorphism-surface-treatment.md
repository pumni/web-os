# 0014. Glassmorphism Surface Treatment

- **Status:** Accepted
- **Date:** 2026-06-20
- **Owner:** Design system / `@pumni/ui`

## Context

ADR-0012 moved the glass layer **away** from iOS/visionOS frosted vibrancy toward
"engineered dark-glass": low blur (12px), `saturate(1.05)` (no vibrancy pump), a
thin neutral fill, and a bright-top/dark-bottom rim pair. In review the owner
found that the engineered glass read flat and muddy — especially the
`/design-system` "Surface Primitives" demo, where glass was even rendered on a
flat opaque card with no backdrop to refract, so it looked like washed-out grey
boxes.

The owner's decision: the reusable glass layer should follow **modern
glassmorphism** — frosted blur, vibrant backdrop refraction, a luminous light
border, and an inner sheen — and the naming should reflect that (not the
"engineered dark-glass" framing).

Scope was settled explicitly: **only the reusable glass layer** in `@pumni/ui`
(`Card variant="glass"`, `GlassSurface`, `glass-*`). **Content cards stay solid**
— ADR-0012's structural decisions (solid cards carry real elevation, glass only
for floating layers, OS shell presentational/de-Appled, the APCA gate
authoritative, a11y fallbacks intact) are **kept**. This ADR amends only the
*visual treatment* of glass.

Hard constraints that bound the treatment:

- The APCA gate (`glass-contrast.test.ts`) parses `--glass-bg` and
  `--glass-border` as **single colours** composited over the desktop blobs (text
  ≥ Lc 50 light / 60 dark; UI edge ≥ Lc 25). Neither token may become a gradient.
- A pure-light border fails the Lc 25 UI-edge gate on a light surface (ADR-0012
  already hit this), so the luminous border read must come from an ungated
  specular highlight, not from `--glass-border`.
- `glass-saturate.test.ts` requires every `saturate()` in `glass.css` to read
  `var(--glass-saturate)` (no numeric literal).

## Decision

Reframe the glass layer as **glassmorphism** and carry the look with frosted blur
+ vibrancy + a luminous highlight + an inner sheen — layered so the APCA gate
still reads single fill/border colours.

**1. Frosted + vibrant (`tokens.css`).** `--blur-glass` 12 → **16px** (`-sm`
8→10, `-lg` 20→24); `--glass-saturate` 1.05 → **1.4** (the vibrancy that makes the
blurred backdrop read richer — the glassmorphism signature). Both are outside the
APCA gate, so they change freely.

**2. Luminous edge pair, renamed (`theme.css`).** The rim tokens are renamed to
glassmorphism vocabulary — `--glass-rim-top` → **`--glass-highlight`**,
`--glass-rim-bottom` → **`--glass-shadow-edge`** — and the highlight is
brightened (light 0.45→0.6, dark 0.16→0.30) so it reads as the luminous glass
border glow. `--glass-border` stays the gated structural definition line (dark
brightened 42%→48%, still ≥ Lc 25; light unchanged). The rename is contained to
`theme.css` + `glass.css` (grep-verified).

**3. Inner sheen (`theme.css` + `glass.css`).** A new `--glass-sheen` token (a
faint white, light `oklch(1 0 0 / 0.1)` / dark `0.06`) is layered as a
`background-image: linear-gradient(135deg, var(--glass-sheen), transparent 42%)`
over the gated `--glass-bg` in `glass-panel`/`glass-window`. The gradient is a
separate layer the gate does not read, so the gate still composites the solid
`--glass-bg`. The sheen is neutralised in every opaque a11y fallback (the
`background` shorthand paths reset it; the two `contrast: more` blocks add an
explicit `background-image: none`).

**4. Naming (`showcase.tsx` + docs).** Fixed the mislabelled "Glass Card
(Default)" (the Card default is `solid`, not glass) and reframed copy from
"engineered" to "glassmorphism"; the demo glass now sits over a blob backdrop so
it reads as glass. Docs (`design-system.md`, the ui-styling skill) and this ADR
move the framing from "engineered dark-glass" to "glassmorphism".

Public utility/variant names (`glass-panel/bar/window/titlebar`, `GlassSurface`
variants, `Card variant="glass"`) are **kept** — they are used across ~34 files,
already read as "glass", and renaming them would be churn without benefit.

## Consequences

**Positive:**

- The glass layer reads as modern glassmorphism (frosted, vibrant, luminous
  border, inner sheen) over a backdrop, fixing the muddy engineered look.
- The luminous border is carried by the ungated `--glass-highlight`, so the
  glassmorphism edge ships without weakening the APCA UI-edge gate.
- Vibrancy remains one knob (`--glass-saturate`), still locked by the drift test.

**Negative / costs:**

- Higher blur (16px) and saturate (1.4) cost more GPU than the engineered 12px /
  1.05 — acceptable because glass is restricted to floating layers (ADR-0012),
  not large backgrounds.
- Glass now visibly needs a backdrop to read; on a flat opaque surface it looks
  weak. Demos/usages must float it over the desktop blobs (the showcase backdrop
  pattern), not nest it on a solid card.
- `--glass-sheen` is a new token a rebrand project may want to set; it defaults
  sensibly if left alone.

**Neutral:**

- Token tier count stays three; `--glass-sheen`/`--glass-highlight`/
  `--glass-shadow-edge` are semantic (Tier 2), blur/saturate are Tier 1.
- ADR-0012 is **amended, not superseded**: its solid-card elevation, de-Appled OS
  chrome, glass-only-for-floating discipline, and gate authority all stand. Only
  the glass *visual treatment* changes.

## Alternatives considered

- **Keep engineered dark-glass; only fix the showcase backdrop.** Rejected: the
  owner wants the glass *look* to be glassmorphism, not just a better demo. The
  muddy read came from the treatment (low blur, no vibrancy, thin neutral fill),
  not only the missing backdrop.
- **Make `--glass-bg`/`--glass-border` gradients for the glassmorphism look.**
  Rejected: the APCA gate parses them as single colours; a gradient breaks the
  gate parser and the fallbacks. The sheen is added as a separate `background-
  image` layer instead.
- **Brighten `--glass-border` to a pure-light glassmorphism border.** Rejected
  for light mode: a near-white border fails the Lc 25 UI-edge gate on a light
  surface (the ADR-0012 finding). The luminous edge is delivered by the ungated
  `--glass-highlight` specular inset instead.
- **Rename the public `glass-*` / `GlassSurface` / `Card variant` API to a
  "glassmorphism" namespace.** Rejected: ~34-file ripple across overlays and
  features for names that already read as "glass". Only the internal rim tokens
  were renamed.

## References

- `packages/ui/src/styles/tokens.css` — `--blur-glass*`, `--glass-saturate`.
- `packages/ui/src/styles/theme.css` — `--glass-highlight` / `--glass-shadow-edge`
  (renamed), `--glass-sheen`, `--glass-bg` / `--glass-border`.
- `packages/ui/src/styles/glass.css` — sheen `background-image` layer, the
  luminous edge insets, a11y-fallback neutralisation.
- `apps/web/src/test/design-system/glass-contrast.test.ts` — APCA gate (unchanged
  thresholds; border tuned to pass).
- `apps/web/src/test/design-system/glass-saturate.test.ts` — drift guard for the
  tokenized `--glass-saturate`.
- `apps/web/src/app/(app)/design-system/showcase.tsx` — glass demos over a
  backdrop; fixed labels.
- `docs/adr/0012-engineered-glass-surface-language.md` — the surface decisions
  this ADR amends (visual treatment only).
