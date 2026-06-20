# Engineered Glass & Surface Modernization — Implementation Plan

> **Status:** Ready for execution. Authored from a design-review session on the
> `@pumni/ui` surface layer. Another agent will execute this plan phase by phase.
> **Owner decision (settled, do not re-litigate):**
> 1. **Surface identity = "engineered dark-glass" (rời Apple).** Glass becomes
>    thinner/clearer, lower blur, with a **bright top rim + dark bottom rim** and
>    a directional shadow — instead of the current iOS/visionOS frosted vibrancy
>    (heavy blur + `saturate(1.3)` + top-only inner sheen).
> 2. **OS-shell (Window/Dock/Bento) stays presentational chrome.** No window
>    manager / drag / resize work. We only restyle and **remove the macOS
>    traffic-light controls** (the most on-the-nose Apple tell).
> 3. Output of the review session is this plan; implementation is downstream.

---

## 0. Context the executor must load first

Read before touching anything (these are P1–P2 authority, this plan is P5):

- `docs/conventions/design-system.md` — hard rules (3 token tiers, surface
  vocabulary, APCA gate, radius/z-index, no raw color).
- `.agents/skills/ui-styling/SKILL.md` + `REFERENCE.md` — reference tables.
- Token source of truth:
  - `packages/ui/src/styles/tokens.css` (Tier 1 primitive)
  - `packages/ui/src/styles/brand.css` (brand contract / project override)
  - `packages/ui/src/styles/theme.css` (Tier 2 semantic)
  - `packages/ui/src/styles/glass.css` (glass utilities)
- The gate that owns the cascade: `apps/web/src/test/design-system/glass-contrast.test.ts`.

### Non-negotiable invariants (P0–P2 — a change that breaks these is wrong)

1. **Three token tiers only.** Primitive → semantic → component. Components read
   semantic utilities only; never raw `oklch()` or a primitive var in TSX.
2. **APCA gate stays authoritative.** Do **not** weaken thresholds in
   `glass-contrast.test.ts` to make a new token pass. Tune the *token*, re-run
   the test. The test composites `--glass-bg` over the desktop blob tokens and
   asserts: text (`--foreground`) ≥ **Lc 50 light / 60 dark**, UI edge
   (`--glass-border`) ≥ **Lc 25**. Any glass-bg/border edit must keep these.
3. **Surfaces remain opaque except glass.** No `bg-card/NN`, one `border-border`,
   no raw elevation shadows in TSX, radius via named utilities only.
4. **All a11y fallback blocks stay intact** in `glass.css`
   (`prefers-reduced-transparency`, `@supports not backdrop-filter`,
   `prefers-contrast: more`, `forced-colors: active`, `prefers-reduced-motion`).
   New box-shadow rims must be neutralized in the opaque-fallback paths too.

### Gate commands (run the matching set after each phase)

```
bun run lint
bun run typecheck
bun run test            # esp. glass-contrast, dark-typography, motion-tokens, z-layering, inverse-apca, showcase
bun run ai:check        # only if you touch docs/.agents/conventions
```

Run `bun run test apps/web/src/test/design-system/glass-contrast.test.ts` in a
tight loop while tuning glass tokens.

---

## Design intent — what "engineered dark-glass" means concretely

| Dimension | Current (iOS frosted) | Target (engineered) |
| --- | --- | --- |
| Blur | `16px` (`--blur-glass`) | `12px` (clearer, content-forward) |
| Saturate | `saturate(1.3)` hardcoded (vibrancy) | `saturate(~1.05)`, tokenized — drop the vibrancy pump |
| Fill opacity | `51%` light / `36%` dark (milky) | thinner (verify against gate; rims carry crispness, not opacity) |
| Edge | one uniform hairline + top-only blurred sheen | **bright top rim (1px) + dark bottom rim (1px)** via inset box-shadow + hairline border |
| Shadow | symmetric layered ambient | slightly **directional** (down-right key light) |
| Solid card | `shadow-card = --shadow-1` (≈ invisible) | richer multi-layer soft elevation + top highlight |
| Window controls | macOS red/amber/green traffic lights | neutral monochrome icon buttons |

The brand still shows through via the desktop blobs and `--primary` fills — not
via a tint on every glass edge. Glass tokens move toward **neutral** (drop the
`primary 5–6%` tint) for a cleaner, less "decorated" engineered look.

---

## Phase 1 — Primitive knobs (`tokens.css`)

**File:** `packages/ui/src/styles/tokens.css`

1. Lower the default glass blur (engineered = clearer). Around line 133–137:
   ```css
   /* --- Glass blur (engineered: clearer than the old frosted 16px) --- */
   --blur-glass-sm: 8px;
   --blur-glass: 12px;     /* was 16px */
   --blur-glass-lg: 20px;  /* was 24px */
   --blur-scrim: 4px;
   ```
   > Note: `personalization.css` maps `data-glass=soft→sm`, `strong→lg`. Keep
   > that mapping; the three steps just shift down.

2. Tokenize the saturate (currently hardcoded `1.3` in `glass.css`). Add next to
   the blur block:
   ```css
   /* Engineered glass keeps backdrop colour close to true — no vibrancy pump. */
   --glass-saturate: 1.05;
   ```

3. Retune `--shadow-glass` to be **directional** (key light from top, slight
   down bias) instead of purely symmetric. Replace the existing `--shadow-glass`
   (lines ~145–147):
   ```css
   --shadow-glass:
     0 1px 2px -1px oklch(0 0 0 / 0.07),
     0 8px 16px -6px oklch(0 0 0 / 0.12),
     0 20px 40px -14px oklch(0 0 0 / 0.16);
   ```
   Keep `--shadow-glass-glow-soft` / `--shadow-glass-glow-base` as-is (windows).

4. Add a **solid-card elevation primitive** (richer than `--shadow-1`) — this is
   what lets solid cards stop being flat so people stop reaching for glass. Add
   below the shadow block:
   ```css
   /* Solid content elevation — soft multi-layer, modern depth (NOT a flat 1px).
      The inset top hairline reads as a lit top edge on the opaque surface. */
   --shadow-card-raised:
     0 1px 2px -1px oklch(0 0 0 / 0.05),
     0 4px 10px -3px oklch(0 0 0 / 0.07);
   ```

**Acceptance:** `bun run test` passes (motion-tokens.test.ts asserts duration/
easing sync — these are untouched; just confirm no incidental breakage). No
visual yet.

---

## Phase 2 — Semantic glass tokens (`theme.css`)

**File:** `packages/ui/src/styles/theme.css`

This is the core of the look. Edit **both** `:root` (light, ~lines 56–77) and
`.dark` (~lines 161–179) glass blocks.

### 2a. Thin, neutral glass fill + rim pair

Replace the light `:root` glass block:

```css
/* Engineered glass — thin neutral fill; crispness comes from the rim pair +
   directional shadow, not from a milky high-opacity frost. */
--glass-bg: color-mix(in oklch, var(--neutral-0) 44%, transparent);
/* Neutral hairline (no brand tint) — kept for the APCA UI-edge gate + the
   forced-colors / reduced-transparency fallbacks. */
--glass-border: color-mix(in oklch, var(--neutral-950) 14%, transparent);
/* Specular rim pair: bright top edge + dark bottom edge (real glass). Applied
   as inset box-shadows in glass.css, so NOT subject to the APCA token gate. */
--glass-rim-top: oklch(1 0 0 / 0.55);
--glass-rim-bottom: oklch(0.2 0.01 260 / 0.08);
--glass-scrim: color-mix(in oklch, var(--neutral-50) 55%, transparent);
--glass-blur: var(--blur-glass);
```

Replace the `.dark` glass block:

```css
/* Dark engineered glass — keep enough fill that white text holds Lc 60 over the
   blobs (gated); the bright top rim does the "glass" read. Tune fill % DOWN only
   as far as the gate allows. */
--glass-bg: color-mix(in oklch, var(--neutral-900) 34%, transparent);
--glass-border: color-mix(in oklch, var(--neutral-0) 18%, transparent);
--glass-rim-top: oklch(1 0 0 / 0.16);
--glass-rim-bottom: oklch(0 0 0 / 0.24);
--glass-scrim: color-mix(in oklch, var(--neutral-950) 50%, transparent);
--glass-blur: var(--blur-glass);
```

> **Delete** the now-unused `--glass-highlight` and `--glass-edge` tokens **only
> after** Phase 3 stops referencing them. Grep first:
> `rg -- '--glass-highlight|--glass-edge\b' packages/ apps/`. If anything outside
> `glass.css` reads them, migrate it. (Expected: only `glass.css` does.)

### 2b. Verify the gate, then tune

Run `bun run test apps/web/src/test/design-system/glass-contrast.test.ts`.

- If **light text** fails Lc 50: raise `--glass-bg` light fill % (e.g. 44→48).
- If **dark text** fails Lc 60: raise `.dark --glass-bg` fill % (34→38). Do
  **not** lower it past the gate for the sake of "thinner".
- If **UI-edge** fails Lc 25: increase `--glass-border` darkness (light) /
  brightness (dark).

Record the final passing values in a comment with the APCA margin, matching the
existing house style (the file already documents these tradeoffs inline).

**Acceptance:** glass-contrast.test.ts green in light + dark.

---

## Phase 3 — Glass utilities rewrite (`glass.css`)

**File:** `packages/ui/src/styles/glass.css`

### 3a. `glass-panel` and `glass-window` — rim pair, no top-sheen, tokenized saturate

Replace `@utility glass-panel` (lines ~14–26):

```css
@utility glass-panel {
  /* Engineered glass: thin neutral fill, tokenized saturate (no vibrancy pump),
     a bright top rim + dark bottom rim (inset box-shadows) instead of a single
     hairline + skeuomorphic top sheen. Float depth = directional --shadow-glass. */
  background-color: var(--glass-bg);
  border: 1px solid var(--glass-border);
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
  backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
  box-shadow:
    var(--shadow-glass),
    inset 0 1px 0 0 var(--glass-rim-top),
    inset 0 -1px 0 0 var(--glass-rim-bottom);
}
```

Apply the **same rim-pair + tokenized-saturate** treatment to `glass-window`
(swap its drop shadow for `var(--shadow-glass-glow)` as today, keep the rims).
Then update the remaining utilities that referenced the old tokens:

- `glass-bar`, `glass-bar-bordered`, `glass-bar-edge-r`, `glass-bar-edge-b`,
  `glass-titlebar`: replace every `saturate(1.3)` / `saturate(1)` literal with
  `saturate(var(--glass-saturate))`, and replace the old top-only
  `inset 0 1px 0 0 var(--glass-highlight)` sheen with
  `inset 0 1px 0 0 var(--glass-rim-top)`. Bars do **not** need the bottom rim
  (they butt against the viewport) — top rim only.
- `.glass-window[data-active='false']` (lines ~41–49) and its titlebar: keep the
  "inactive" dimming but swap `--glass-highlight` → `--glass-rim-top` and the
  literal `saturate(1)` → `saturate(var(--glass-saturate))`.

### 3b. Fix the a11y fallbacks for the new rims

The box-shadow rims must be removed in the opaque/forced paths so they don't
ghost over a solid fallback surface:

- In the `@media (prefers-reduced-transparency: reduce)` block (~121–134) and the
  `.glass-a11y-preview[data-transparency='reduced']` block: add
  `box-shadow: var(--shadow-2);` (replaces the rim insets with flat elevation).
- The `@supports not (...)` block already sets `box-shadow: var(--shadow-2)` —
  keep it.
- `@media (forced-colors: active)` already sets `box-shadow: none` — keep it.

### 3c. Card spotlight (no functional change required here)

`@utility card-spotlight` stays. (Phase 7 optionally upgrades it.)

**Acceptance:** `bun run test` green; visually confirm in Phase 8 showcase that
glass panels read as crisp engineered glass (bright top edge, dark bottom edge,
clearer backdrop) rather than milky frost.

---

## Phase 4 — Solid card stops being flat (`card.tsx` + `theme.css`)

**Goal:** make `variant="solid"` compelling on its own so glass is reserved for
true floating layers.

**File:** `packages/ui/src/styles/theme.css`

1. Point the Tailwind elevation utility at the new primitive. In `@theme inline`
   (line ~317) change:
   ```css
   --shadow-card: var(--shadow-card-raised);   /* was var(--shadow-1) */
   ```
   Keep `--shadow-control: var(--shadow-control)` and `--shadow-raised:
   var(--shadow-2)` as-is.

2. Add a card top-highlight semantic token (lit top edge on the opaque surface),
   in both `:root` and `.dark`:
   ```css
   /* :root */  --card-rim-top: oklch(1 0 0 / 0.6);
   /* .dark  */ --card-rim-top: oklch(1 0 0 / 0.05);
   ```

**File:** `packages/ui/src/components/card.tsx`

3. Update the `solid` (and `spotlight`) variant so the surface carries the rim.
   The cleanest path that stays token-only is a utility class; add a small
   `@utility surface-raised` in `theme.css` or extend the existing class string.
   Recommended — extend the variant strings (lines ~43–54):
   ```ts
   solid: 'border bg-card shadow-card [box-shadow:var(--shadow-card-raised),inset_0_1px_0_0_var(--card-rim-top)]',
   ```
   > If the arbitrary `[box-shadow:…]` form trips the lint rule for raw values,
   > instead add a named `@utility surface-raised { box-shadow: var(--shadow-card-raised), inset 0 1px 0 0 var(--card-rim-top); }`
   > in `theme.css` and use `solid: 'border bg-card surface-raised'`. **Prefer the
   > named utility** — it matches the project's "no magic values in TSX" stance.
   Apply the same to `spotlight`.

**Acceptance:** Solid cards in the showcase show a soft, layered lift + a faint
lit top edge; they no longer look flat. `bun run lint` clean (no raw-value
violations).

---

## Phase 5 — De-Apple the OS window chrome (`window.tsx` + `theme.css`)

**File:** `packages/ui/src/components/os/window.tsx`

Replace the macOS traffic-light controls with neutral engineered icon buttons.
The component stays presentational (decision #2 — no behavior change).

1. `WindowControl` (lines ~20–37): drop the `text-transparent` + colored-dot
   pattern. New baseline: a square-ish rounded icon button that always shows its
   glyph in `text-muted-foreground`, with `state-hover` and a `destructive` tint
   only on the close control's hover.
   ```tsx
   className={cn(
     'inline-flex size-6 items-center justify-center rounded-md text-muted-foreground',
     'transition-colors hover:text-foreground focus-visible:outline-2',
     'focus-visible:outline-offset-2 focus-visible:outline-ring [&_svg]:size-3.5',
     'state-hover',
     className,
   )}
   ```
2. In `Window` (lines ~72–94): remove the `bg-(--window-control-*)` classes.
   Give the close button a destructive hover, e.g. add
   `hover:text-destructive` to its `className`. Keep the `aria-label`/`title`.
3. Keep the titlebar layout, the `motion.section` entrance, `useReducedMotion()`,
   and the `glass-titlebar`/`glass-window` classes (which now look engineered).

**File:** `packages/ui/src/styles/theme.css`

4. The `--window-control-close/minimize/maximize` and `--window-control-icon`
   tokens (lines ~87–92, 189–192) are now unused. Grep
   (`rg -- '--window-control' packages/ apps/`) and delete them from both `:root`
   and `.dark` if nothing else references them. If the showcase references them,
   migrate that first (Phase 8).

**Acceptance:** Window titlebar shows three neutral monochrome controls (close
goes red on hover), no macOS traffic lights. `showcase.test.tsx` still passes
(it asserts the "Unmount Window" toggle and window roles, not the dot colors —
verify).

---

## Phase 6 — Glass tokens cleanup + drift guard

1. Remove dead tokens confirmed unused after Phases 2–3 (`--glass-highlight`,
   `--glass-edge`, and the window-control tokens from Phase 5). Grep-verify zero
   references before deleting.
2. **Optional drift test** (recommended, mirrors `motion-tokens.test.ts` style):
   add `apps/web/src/test/design-system/glass-saturate.test.ts` asserting that
   `glass.css` contains **no** hardcoded `saturate(` numeric literal — every
   occurrence must be `saturate(var(--glass-saturate))`. This locks the
   tokenization so a future edit can't silently reintroduce a magic vibrancy
   value. Keep it tiny (regex over the file, same pattern as the existing CSS
   token tests in that folder).

**Acceptance:** `rg -- 'saturate\(1' packages/ui/src/styles/glass.css` returns
nothing; new test (if added) green.

---

## Phase 7 — (Stretch / optional) Brand color role split + spotlight upgrade

Do **only after** Phases 1–6 land and the gate is green. These address "cyan
trông xỉn" and "card hover kiểu 2021" but are larger and independently shippable.

### 7a. Split the brand fill vs. brand text role

Problem: `--primary` does double duty — a fill that hosts white text **and**
`text-primary` on light surfaces — so it is forced dark/muted to satisfy both.

- In `brand.css`: keep `--brand-primary` (the fill). Add `--brand-primary-text`
  (one–two stops darker, e.g. `var(--cyan-700)` light / `var(--cyan-400)` dark)
  for text-on-light usage.
- In `theme.css`: add semantic `--primary-text: var(--brand-primary-text)` and
  expose `--color-primary-text` in `@theme inline`. Migrate `text-primary`
  call-sites that sit on light surfaces to `text-primary-text` where contrast is
  marginal. `--primary` (fill) can then be tuned slightly more vivid without
  breaking the white-foreground gate.
- **Gate:** the APCA test asserts white `--primary-foreground` on `--primary`
  ≥ Lc 60 for every accent (cyan/indigo/violet/rose, light+dark). Any vividness
  bump must keep that. Add a text-on-surface assertion for `--primary-text` if
  you introduce it.

### 7b. P3 wide-gamut brand boost

Add, after the brand defaults in `brand.css`:
```css
@media (color-gamut: p3) {
  :root { --brand-primary: oklch(0.55 0.16 202); }  /* higher chroma on P3 */
  .dark { --brand-primary: oklch(0.62 0.17 202); }
}
```
Tune values; the sRGB fallback (the existing `--cyan-*`) stays authoritative for
the gate (tests run in a non-P3 context).

### 7c. Spotlight → border-following gradient (2026 interactive card)

Upgrade `@utility card-spotlight` so the **border** lights up following the
cursor (mask/`background-origin: border-box` + the existing `--spot-x/--spot-y`)
rather than a fill radial. Keep it compositor-safe (opacity + CSS vars only) and
keep the `prefers-reduced-motion` hide. `CardSpotlight` client wrapper is
unchanged (it already injects the vars).

**Acceptance:** gate green for all accents; spotlight reads as a moving border
glow; reduced-motion still hides it.

---

## Phase 8 — Showcase + visual verification (`design-system/showcase.tsx`)

**File:** `apps/web/src/app/(app)/design-system/showcase.tsx`

- Update any prose that describes glass as "frosted/vibrancy/iOS" to the
  engineered language. Update the surface-role legend if it names the old
  highlight/edge tokens.
- Confirm the glass, card, and window sections render the new look. Migrate any
  direct reference to removed tokens (`--window-control-*`, `--glass-highlight`,
  `--glass-edge`).
- Keep `apps/web/src/test/design-system/showcase.test.tsx` green (it checks the
  "Unmount Window" control and surface roles — adjust the test only if a role
  label legitimately changed, never to paper over a regression).

**Manual visual check:** run the app, open `/design-system`, eyeball in **light +
dark** and toggle the `data-glass` soft/default/strong and `data-density`
controls. Verify: glass is crisp (bright top rim, dark bottom rim, clearer
backdrop), solid cards have real lift, window has no traffic lights.

**Acceptance:** full `bun run test`, `bun run lint`, `bun run typecheck` green;
optional `bun run build` if any bundle/config touched (none expected).

---

## Phase 9 — Docs, ADR, memory (run `bun run ai:check` + `bun run ai:eval`)

1. **`docs/conventions/design-system.md`** — update the anti-slop table row and
   the "Surface utilities" section: replace "iOS vibrancy / top sheen" framing
   with the engineered rim-pair model. Note `--glass-saturate` as the single
   vibrancy knob and the rim-top/rim-bottom tokens.
2. **`.agents/skills/ui-styling/REFERENCE.md`** — update the glass token table
   (new `--glass-rim-top/-bottom`, `--glass-saturate`, removed
   `--glass-highlight/--glass-edge`), the solid-card elevation note, and the
   window-control change.
3. **New ADR** `docs/adr/0012-engineered-glass-surface-language.md` — record:
   the move from frosted/iOS vibrancy to engineered dark-glass, the rim-pair
   mechanism, the tokenized saturate, the solid-card elevation bump, and the
   decision to keep OS-shell presentational. Cross-link ADR-0010 (brand
   contract). Add it to `docs/adr/README.md`.
4. **`docs/ai/MEMORY.md`** — add a tool-agnostic line under the design section:
   surface identity = engineered dark-glass (not iOS frosted); glass uses a
   bright-top/dark-bottom rim pair + tokenized `--glass-saturate`; solid cards
   carry real elevation; OS Window/Dock are presentational chrome only.

**Acceptance:** `bun run ai:check` and `bun run ai:eval` green.

---

## Execution order & checkpoints

```
Phase 1 → test                         (primitive knobs; no visual)
Phase 2 → glass-contrast.test (loop)   (semantic glass; GATE-sensitive)
Phase 3 → test                         (utilities; visual change lands)
Phase 4 → lint + test                  (solid card elevation)
Phase 5 → test + showcase.test         (de-Apple window chrome)
Phase 6 → grep + test                  (cleanup + drift guard)
Phase 7 → gate (OPTIONAL/stretch)      (brand split, P3, spotlight)
Phase 8 → full gate + manual visual    (showcase)
Phase 9 → ai:check + ai:eval           (docs/ADR/memory)
```

**Definition of done:** Phases 1–6 + 8 + 9 complete, every gate green, the
`/design-system` page shows engineered glass + lifted solid cards + neutral
window controls in both themes, and no APCA threshold in
`glass-contrast.test.ts` was weakened. Phase 7 may ship as a follow-up.

## Risk notes for the executor

- **The APCA gate is the boss, not these proposed values.** Every numeric token
  here is a starting target. If a value fails the test, adjust the *token* (per
  the Phase 2b tuning guide) — never the threshold.
- **Dark-mode glass transparency is the tightest constraint.** Thin fill + dark
  blobs can drop white-text contrast below Lc 60. If torn, keep the fill % and
  let the bright top rim carry the "thin glass" read.
- **Lint blocks raw values/colors in TSX.** Prefer named `@utility` classes over
  arbitrary `[box-shadow:…]` (Phase 4) to stay clean.
- **Grep before deleting any token.** `--glass-highlight`, `--glass-edge`,
  `--window-control-*` are expected to be glass.css/window.tsx-only, but verify
  across `packages/` and `apps/` first.
</content>
</invoke>
