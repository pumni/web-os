# 0012. Surface Visual Language (consolidated)

- **Status:** Accepted (amended 2026-07-05 per 2026 trend alignment — inline amendment per convention; cosmetic scope, not a supersede)
- **Date:** 2026-06-20 (consolidated 2026-06-22 · amended 2026-07-05)
- **Owner:** @pumni/ui design system

## Context

The surface identity (glass vs solid) went through nine same-week ADRs
(0012–0020, 2026-06-20/21) as the visual treatment was tuned. Recording each
reversible CSS-token change as its own immutable ADR violated the ADR bar
(`docs/adr/README.md`) and triple-logged every tweak (ADR file + README index
+ MEMORY.md). This ADR consolidates the *durable* decision; the token values
themselves live in `docs/conventions/design-system.md`, which is the single
source of truth and may change without a new ADR.

### 2026 alignment review (2026-07-04)

A pass against seven 2026 glassmorphism references (Orizon's *"Glassmorphism
in 2026: How to Use Frosted Glass Without Killing UX"* Feb 2026; UX Pilot's
*"12 Glassmorphism UI Features, Best Practices, and Examples"* citing Apple
iOS 26 / macOS Tahoe; MDN `backdrop-filter` baseline 2024; CSS-Tricks;
dev.to; Kreativa *"Glassmorphism Web Design: What B2B Brands Should Know"*
Jun 2026; Stack Overflow blur perf thread) found four drift points where
the consolidated ADR's choices fell behind the 2026 consensus:

1. **`--glass-edge` was not mode-adaptive.** Same pure-white hairline in
   both light and dark mode. UX Pilot 2026 explicitly recommends
   *"In light mode, glass needs stronger boundaries … slightly higher
   opacity or a touch more blur"* and *"In dark mode, swap to …
   neutral-gray highlights or a subtle colored rim (navy, violet, teal)
   instead of pure white"* to avoid harsh glow. The ADR-0016 choice
   (uniform white hairline in both modes) collapsed toward invisible on
   near-white light backdrops and glowed harshly on dark.
2. **Glass border was exempt from the APCA gate.** ADR-0014 rescoped the
   Lc 25 border gate to solid surfaces only because a 0.45-alpha white
   edge cannot clear Lc 25 over a light backdrop. *(SUPERSEDED 2026-07-05:
   ADR-0014's exempt was **right**, not a workaround. Reading the 2026
   references' "borders help lock onto boundaries" as "the glass edge must
   clear a contrast ratio" was the error — those references describe a
   light-catching stroke, and boundary lock-on for glass comes from the
   drop shadow. The gate the 2026-07-04 review added to glass has been
   removed; the edge is an ungated light rim. See the border-doctrine
   correction below.)*
3. **Corner-shine / directional rim was banned outright (ADR-0016 sheen
   removal).** Apple Liquid Glass, which UX Pilot cites as the 2026
   reference, carries a *specular edge highlight along the side facing
   the light source* — directional, not uniform. Banning it entirely
   removed a legitimate hero/showcase technique. Production bulk list
   cards still shouldn't carry it (visual noise), but a single
   hero/showcase card per surface should be allowed.
4. **Blur floor sat at 8px.** UX Pilot recommends `blur(4–6px)` as the
   subtle baseline and flags `>20px` as GPU-heavy. The 8–16px range is
   defensible as a "frosted" stylistic choice (Pumni wants frosted, not
   tinted), but the ADR did not document this rationale, leaving readers
   to assume 8px was the universal 2026 floor.

This amendment records the alignment decisions below. Token value changes
land in `theme.css` / `design-system.md` (the SSOT) without a new ADR — this
ADR edit only captures the *why*.

## Decision

- **Glass = floating layers only**, over a colourful backdrop; **solid
  (`surface-raised`) = dense content and flat backgrounds.** Banned: glass for
  forms/long text/tables.
- **APCA contrast gate is authoritative for TEXT/FILL pairs** — every surface
  must keep a single readable fill/text pair regardless of visual layering.
  **(Corrected 2026-07-05, superseding the 2026-07-04 amendment)** The APCA gate
  does **not** apply to the glass *edge*. The glass edge is a specular light rim
  (a light effect), not a readability boundary; the drop shadow
  (`--shadow-glass`) delineates the panel, and the `prefers-contrast` /
  `prefers-reduced-transparency` fallbacks are the accessibility path. The prior
  "Lc 25 border gate on glass" was false doctrine — see the 2026-07-05
  border-doctrine correction below.
- **Composition primitives** (`Card`, `CardWell`, `Badge`, `IconBadge`,
  layout-only `BentoGridItem`) are the only sanctioned surface consumers;
  ad-hoc surfaces are blocked by `pumniNoAdHocSurface`.
- **Token values, the 5-element model, the border-consumption flow, blur/perf
  budgets, and drift guards are owned by `docs/conventions/design-system.md`.**
  Changing a token value is a doc edit, NOT a new ADR.

### Amendments (2026-07-04 alignment)

- **`--glass-edge` is mode-inverted.** *(SUPERSEDED 2026-07-05 border-doctrine
  correction — the premise below is wrong.)* This amendment read UX Pilot's *"In
  light mode, glass needs stronger boundaries"* as a mandate to invert the
  light-mode edge to a dark navy stroke so it could clear an APCA contrast gate.
  That conflated "stronger boundary" (slightly higher opacity/blur) with
  "high-contrast dark outline," and produced a rim that read like a solid card.
  The corrected rule: the edge is a **light** specular rim in both modes (white
  in light, soft light-violet in dark), ungated. The dark navy light-mode values
  it introduced are gone.
- **Corner-shine / directional rim is allowed for hero/showcase cards
  only.** ADR-0016's blanket sheen removal stays in force for production
  bulk list cards (uniform hairline + drop shadow), but a new
  `glass-panel[data-variant="specular"]` utility (and matching
  `Card variant="specular"`) is added for hero/showcase surfaces — cap
  one specular card per visible surface, always over a colourful backdrop.
  This aligns with Apple Liquid Glass and UX Pilot's *"rim light along
  the side facing the light source"*.
- **Blur range 8–16px is a deliberate "frosted" choice, not the 2026
  baseline.** UX Pilot 2026 cites `blur(4–6px)` as the subtle baseline.
  Pumni keeps 8–16px because the OS visual identity is "frosted glass,
  not tinted overlay" — the ADR now records that rationale. Production
  sweet spot 12px (light) / 16px (dark) stays. `>16px` remains
  GPU-heavy-banned except for the Liquid Glass refraction mask in
  `glass-2026-primitives.tsx` (showcase-only).

### Amendments (2026-07-05 alignment - Specular Stops & Gradient Tint)

- **Specular highlights are mode-adaptive (`--specular-rim-*`).** Previously, `--specular-rim-start` and `--specular-rim-mid` were hardcoded pure white, producing a harsh, synthetic glow in dark mode. We changed them to use `light-dark()`: light mode uses bright white reflections (`oklch(1 0 0 / 0.60)`), while dark mode uses a soft, light neutral-violet reflection (`oklch(0.9 0.03 270 / 0.35)`) to prevent glare on dark interfaces.
- **Glass utility background accepts gradients (`background: var(--glass-tint)`).** In `glass.css`, changed `background-color: var(--glass-tint)` to `background: var(--glass-tint)` across core glass utilities. This enables alpha-channel gradient tints (simulating physical thickness) to be passed natively.
- **Refraction / Chromatic Aberration Deleted (2026-07-05).** The Liquid Glass refraction and chromatic aberration offsets were completely deleted from both the production style sheets and the simulator playground to avoid overengineering, visual noise (blurry text), and GPU overhead.
- **Asymmetric Edge Bevels (`--glass-edge-top`/`--glass-edge-bottom`).** Implemented top-left lighting bevel using asymmetric border colors to simulate depth without GPU cost. *(Mechanism superseded 2026-07-05: per-side border colours miter with a hard diagonal seam that breaks on rounded corners; the bevel is now a masked 1px `::before` gradient ring — see the gradient-ring amendment below.)*
- **Double-Bezel Sub-Pixel Highlights (`--glass-inset-bezel-*`).** Toggled adaptive double inset highlights for sharp structural outlines (1px for light, 0.5px for dark mode).
- **Chroma-shifted Shadows.** Tuned `--shadow-glass` to carry a very subtle matching hue in dark mode (`oklch(0.05 0.005 270 / alpha)`) representing light transmission.

### Amendments (2026-07-05 border-doctrine correction)

- **The glass edge is a specular LIGHT rim, not a contrast boundary — no APCA
  gate applies to it.** The 2026-07-04 "Lc 25 border gate on glass" and its
  2026-07-05 "delineation guarantee on the dominant edge" rescope were both
  **false doctrine**: they treated a decorative light-catch as if it owed a
  readability contrast ratio. No accessibility standard requires that — WCAG
  1.4.11 scopes contrast to *interactive controls* (that duty lives on
  `--input`), and every 2026 glassmorphism reference (Apple Liquid Glass,
  Setproduct, Clay, Lucky Graphics) describes the glass edge as "a thin,
  semi-transparent white stroke, visible enough to define the shape but light
  enough not to draw attention." The gate had forced the light-mode rim to a
  dark navy stroke (`oklch(0.3 …)`), which read like a solid-card outline —
  the opposite of glass.
- **Corrected doctrine.** The edge is a light rim in *both* modes: white in
  light mode (`--glass-edge` `oklch(1 0 0 / 0.55)`, `--glass-edge-top`
  `oklch(1 0 0 / 0.65)`, bottom a faint cool contact shadow `oklch(0.4 0.02
  260 / 0.14)`), softened to a light neutral-violet in dark mode. The
  **drop shadow (`--shadow-glass`) is the delineator**; the only APCA gate on
  glass is **text over `--glass-tint` (Lc 60)**. Accessibility for transparency
  is the `prefers-contrast` / `prefers-reduced-transparency` fallbacks that
  recolour the edge to a solid `--border`.
- **Test change.** `glass-contrast.test.ts` drops the Lc 25 edge gate and
  instead pins the corrected aesthetic (edge is a light rim: lightness ≥ 0.85,
  alpha 0.1–0.7; bottom edge is a shadow subordinate to the top rim). The
  text-over-tint Lc 60 gate and the drop-shadow-delineator guard are unchanged.

## Consequences

- One ADR instead of nine; design-token churn no longer mints ADRs.
- `design-system.md` + the CSS drift guards (`glass-rim`, `glass-performance`,
  `border-consumption`) are the enforcement plane.
- **(Amended 2026-07-04 · SUPERSEDED 2026-07-05)** This bullet formerly required
  `glass-contrast.test.ts` to enforce APCA Lc 25 on `--glass-edge`. That gate was
  false doctrine and has been removed (see the 2026-07-05 border-doctrine
  correction). The test now pins the edge as a light specular rim, not a contrast
  ratio.
- **(Amended 2026-07-04)** Hero/showcase cards may carry `variant="specular"`.
  The structural hairline border is preserved; `variant="specular"` uses a `::before` conic-gradient ring overlay mask-composited over the border, rather than replacing the border-image.
- **(Amended 2026-07-05)** Specular corner highlights are mode-adaptive and soft-glowing violet in dark mode to prevent visual fatigue.
- **(Amended 2026-07-05)** `--glass-tint` natively supports CSS gradient declarations via the background shorthand.
- **(Amended 2026-07-05 border doctrine · SUPERSEDED same day by the border-doctrine correction)** Asymmetric borders (`--glass-edge-top/bottom`) are standard, and the double-bezel outline layer is removed (top highlight only); dynamic refraction/chromatic aberration is banned. The clause that "rescoped the APCA Lc 25 gate to the dominant edge" was only a half-measure — it kept a dark navy light-mode rim to pass the gate. That gate is now removed entirely: both edge stops are ungated specular light (top light-catch → bottom contact shadow). See the border-doctrine correction above.
- **(Amended 2026-07-05 gradient ring)** The bevel is painted as a masked 1px
  `::before` gradient ring (135°, `--glass-edge-top` → `--glass-edge-bottom`)
  that follows `border-radius` — per-side border colours were retired because
  CSS miters differently-coloured borders with a hard diagonal corner seam
  (worst in dark mode where the bright top meets the dark bottom). The specular
  variant layers its conic shine over the same ring; the element keeps a
  transparent 1px metric border for box stability, which the a11y fallbacks
  re-colour to `--border`. Token values and the gate scope are unchanged.
- **(Amended 2026-07-05 grain 2026)** Upgraded `glass-grain` utility to use `::after` (resolving conflict with specular ::before), `isolation: isolate`, and `mix-blend-mode: overlay`. Hạt nhiễu được cố định kích thước 200px (Luminance-only SVG) và điều chỉnh opacity theo mode (`--glass-grain-opacity`: light 0.05 / dark 0.07).

## Alternatives considered

- Keep nine ADRs with status transitions. Rejected: they are reversible
  cosmetic decisions, not architecture; the bookkeeping cost outweighs the
  archaeology value (git retains the originals).
- **(Added 2026-07-04)** Mint a new ADR-0026 for the 2026 alignment
  instead of amending ADR-0012 in place. Rejected: ADR-0012 already says
  token-value changes are doc edits, not new ADRs; the alignment is
  exactly a token-value + design-rationale change. A new ADR would
  double-log the same decision. Amending in place keeps `design-system.md`
  + ADR-0012 as the single glass spec, with the amendment dated inline.

## Superseded micro-ADRs (archaeology)

Folded here (see git history for full text):
0013 card composition primitives · 0014 glassmorphism treatment ·
0015 glass backdrop precondition · 0016 sheen removal + dark blur ·
0017 bento container query · 0018 unify surface-rim-top ·
0019 border consumption flow · 0020 solid cards drop specular rim.

> **Note (2026-07-04 alignment):** ADR-0016's *"sheen removal"* clause
> is amended — the blanket ban on corner-shine is narrowed to *bulk list
> cards only*. Hero/showcase cards may now carry
> `glass-panel[data-variant="specular"]`. ADR-0016's dark-blur raise
> (16px dark vs 12px light) is unaffected and stays in force.
