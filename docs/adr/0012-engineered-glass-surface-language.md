# 0012. Engineered Dark-Glass Surface Language

- **Status:** Accepted
- **Date:** 2026-06-20
- **Owner:** Design system / `@pumni/ui`

## Context

The `@pumni/ui` glass surface layer shipped (ADR-0010) with an **iOS / visionOS
frosted-vibrancy** identity: heavy `blur(16px)` + a hardcoded `saturate(1.3)`
vibrancy pump, a milky high-opacity fill (51% light / 36% dark), a single
translucent hairline, and a top-only inner sheen (`--glass-highlight`). A
design-review session concluded that read as derivative Apple chrome and
muddied content behind it — the opposite of the "engineered" platform identity
Pumni wants.

Two coupled tells anchored the Apple association:

- **The OS window chrome carried macOS traffic-light controls** — red/amber/green
  dots with dark glyphs (`--window-control-close/minimize/maximize`), the most
  on-the-nose Apple cue.
- **Solid `Card` was flat** (`--shadow-card = --shadow-1`, ≈ an invisible 1px
  hairline), so people reached for glass everywhere. Glass lost its "reserved
  for floating layers" role and got spread across content surfaces, amplifying
  the frosted look and the GPU cost the design-system doc warns against.

The APCA contrast gate (`apps/web/src/test/design-system/glass-contrast.test.ts`,
text ≥ Lc 50 light / 60 dark, UI edge ≥ Lc 25) is the non-negotiable constraint:
**any** new glass identity must keep it green, and the gate — not a proposed
token value — is the authority on whether a value is acceptable.

## Decision

Reframe the surface identity as **engineered dark-glass**, keep the OS shell
(Window / Dock / Bento) **presentational chrome only**, and make solid cards
carry real elevation so glass is used only where it earns its cost. The glass
reads as a real lit object, not a milky frost.

**1. Engineered glass: thin neutral fill + a rim pair + directional shadow.**

- Lower blur (clearer, content-forward): `--blur-glass` 16 → **12px** (and
  `-sm` 10→8, `-lg` 24→20). The `data-glass=soft→sm, strong→lg` mapping stays;
  the three steps shift down.
- Tokenize the vibrancy pump once as `--glass-saturate` (≈ **1.05**); every
  `glass-*` utility reads it. No more hardcoded `saturate(1.3)`/`saturate(1)`.
  A drift-guard test (`glass-saturate.test.ts`) locks the tokenization.
- **Rim pair instead of a single hairline + top sheen.** Glass surfaces carry a
  bright top rim (`--glass-rim-top`) + a dark bottom rim
  (`--glass-rim-bottom`) as inset box-shadows — the "real glass" read. The rims
  are specular and **not** subject to the APCA token gate (the gate composites
  `--glass-bg` / `--glass-border`, not the rims).
- Glass tokens go **neutral** (drop the old `--primary` 5–6% brand tint) and the
  fill thins (`--glass-bg` 51→54% light, 36→46% dark) — tuned to the **edge of
  the gate**, with verified margins recorded inline.
- Directional drop shadow (`--shadow-glass`) with a key-light-from-top + slight
  downward bias replaces the symmetric ambient halo.

Removed (grep-verified unused after migration): `--glass-highlight`,
`--glass-edge`, `--window-control-*`.

**2. Solid cards stop being flat.** Add `--shadow-card-raised` (soft multi-layer
elevation) and a `--card-rim-top` lit top edge; expose both through a named
`@utility surface-raised { box-shadow: var(--shadow-card-raised), inset 0 1px 0 0 var(--card-rim-top); }`.
`--shadow-card` (the Tailwind elevation utility) now points at
`--shadow-card-raised`, and the Card `solid`/`spotlight` variants use
`surface-raised` (a named utility, not a magic-value `[box-shadow:…]` in TSX).
Solid content now has real lift, so glass is reserved for true floating layers.

**3. De-Apple the window chrome (presentational only).** Replace the macOS
traffic-light dots with neutral monochrome icon buttons (`size-6 rounded-md`,
`text-muted-foreground`, `state-hover`); the close control goes
`hover:text-destructive`. No behaviour, drag, or resize work — the shell stays
presentational chrome, consistent with ADR-0010's "OS-shell as identity, not a
window manager."

**Invariant preserved:** all a11y fallback paths
(`prefers-reduced-transparency`, `@supports not backdrop-filter`,
`prefers-contrast: more`, `forced-colors: active`, `prefers-reduced-motion`)
stay intact; the new box-shadow rims are explicitly neutralized
(`box-shadow: var(--shadow-2)`) in the opaque-fallback paths so they do not
ghost over a solid surface.

## Consequences

**Positive:**

- The surface identity reads as engineered glass (bright top edge, dark bottom
  edge, clearer backdrop) rather than iOS/vibrancy; the Apple traffic-light
  tell is gone.
- Tokenizing `--glass-saturate` (with a drift test) means vibrancy is one knob;
  a future edit cannot silently reintroduce a magic `saturate(1.3)`.
- Solid cards carry real elevation, restoring the "glass only for floating
  layers" discipline — fewer `backdrop-filter` surfaces, less GPU cost.
- The APCA gate stays the authority: every token value is tuned to its edge with
  the margin recorded inline; **no threshold was weakened**.

**Negative / costs:**

- The engineered look depends on box-shadow rims, which `prefers-reduced-
  transparency` / opaque-fallback paths must flatten — one more thing to keep in
  sync when adding a glass utility. Mitigated by the shared fallback selector
  list and the showcase a11y preview.
- `--card-rim-top` / `--glass-rim-top/-bottom` are new semantic tokens; a
  rebrand project overriding glass must supply rim values too (or accept the
  defaults).
- Dark-mode glass transparency is the tightest constraint (thin fill + dark
  blobs vs. Lc 60 white text); the fill % cannot drop further without breaking
  the gate, so the "thin" read is carried by the bright top rim, not opacity.

**Neutral:**

- Token tier count stays three; the rim tokens are semantic (Tier 2), the
  `--shadow-card-raised` primitive is Tier 1.
- No package split, no behaviour change to the OS shell; ADR-0010's surface
  is untouched in scope.

## Alternatives considered

- **Keep the iOS frosted identity; only de-Apple the window controls.**
  Rejected: the vibrancy pump + milky fill + top sheen is the dominant part of
  the Apple read, not just the traffic lights. De-Apple-ing only the controls
  would leave a derivative surface with non-derivative chrome — incoherent.
- **Weaken the APCA gate to ship the plan's literal proposed values.** Rejected
  explicitly and at P0–P2 priority: the gate owns the cascade. The plan's
  starting values (light 44/14, dark 34/18) failed the **UI-edge** gate (the
  hairline was too light). The fix was to darken `--glass-border` until it
  cleared Lc 25 with margin — not to lower Lc 25. This is recorded so a future
  editor does not re-propose thinning the border by relaxing the test.
- **Make glass fully opaque-on-fallback by default (drop rims everywhere).**
  Rejected: the rims are the engineered identity; removing them defeats the
  purpose. The correct handling is neutralizing them only in the a11y fallback
  paths, which is what shipped.
- **Rebuild the OS shell as a real window manager (drag/resize/focus order).**
  Rejected as out of scope: the decision is presentational-only. A window
  manager is a separate, larger effort with its own ADR if it ever lands.

## References

- `docs/conventions/design-system.md` — hard rules (token tiers, surface
  vocabulary, APCA gate, radius/z-index) this ADR must not contradict.
- `packages/ui/src/styles/tokens.css` — primitive knobs (`--blur-glass*`,
  `--glass-saturate`, `--shadow-glass`, `--shadow-card-raised`).
- `packages/ui/src/styles/theme.css` — semantic glass fill + rim pair
  (`--glass-bg/border/rim-top/rim-bottom`), `--card-rim-top`, `surface-raised`.
- `packages/ui/src/styles/glass.css` — the engineered `glass-*` utilities +
  a11y fallback neutralization of the rims.
- `packages/ui/src/components/card.tsx`,
  `packages/ui/src/components/os/window.tsx` — solid-card elevation and the
  neutral window controls.
- `apps/web/src/test/design-system/glass-contrast.test.ts` — the APCA gate
  (unchanged thresholds; tokens tuned to pass).
- `apps/web/src/test/design-system/glass-saturate.test.ts` — drift guard for
  the `--glass-saturate` tokenization.
- `docs/adr/0010-frontend-platform-foundation.md` — the brand contract +
  OS-shell-as-identity framing this builds on.
