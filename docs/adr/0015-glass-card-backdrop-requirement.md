# 0015. Glass Card Backdrop Requirement

- **Status:** Accepted
- **Date:** 2026-06-20
- **Owner:** Design system / `@pumni/ui`

## Context

ADR-0014 settled the glass *visual treatment* (frosted vibrant fill, luminous edge
pair, volumetric rim) and ADR-0012 the structural rule that **glass is
reserved for floating layers**. Neither ADR spelled out the precondition that makes
the treatment readable at all: a glass surface only reads as glassmorphism when it
**has a colourful backdrop to refract**. Over a flat opaque page, the same
`glass-panel` utility that looks luminous in the showcase degrades to a washed-out
grey box — the exact "muddy" read ADR-0014 opened by fixing.

Modern glassmorphism guidance (mid-2026) is unanimous on three points:

1. **Backdrop is load-bearing.** Frosted glass with nothing behind it has no
   refraction to show; the blur + vibrancy signature vanishes. (Josh Comeau,
   "Next-level frosted glass with backdrop-filter".)
2. **Content density inverts the benefit.** A form, a long text block, or a data
   table on glass is harder to read than the same content on a solid card, and it
   pays the `backdrop-filter` GPU cost for no perceptual gain. (UXPilot, Figr.)
3. **Performance and accessibility are the hard ceiling.** `backdrop-filter`
   forces a separate backdrop render pass; layering many glass surfaces, or glass
   over a flat page, is the worst case for mobile GPU. `prefers-reduced-transparency`
   (Media Queries Level 5, ~71% global support as of 2026) is the canonical
   fallback. (Chrome Developers, Can I Use, WebKit web-perf.)

The drift-guard tests already encode the ceiling: `glass-performance.test.ts` bans
animating `backdrop-filter` and scopes `will-change`; `glass.css` has a CSS
soft-guard that caps stacked glass at 2 layers. But **nothing encodes the
backdrop/usage precondition** — it is prose in the design-system doc and the
ui-styling skill. The result: three production `Card variant="glass"` sites landed
on flat backgrounds with dense form content, and the `/design-trends` showcase page
(the one meant to teach the rule) itself violates ~30 design-system rules while
demonstrating glass. The visual treatment is correct; the *usage* discipline is
not, and it is not enforceable today.

## Decision

Make the backdrop requirement a first-class rule that supplements ADR-0014
(without changing any token, value, or public API name). Glass must float over a
colourful backdrop; otherwise it must be a solid card.

**1. `Card variant="glass"` requires a refracting backdrop.** A glass card is only
valid when colourful content sits *behind* it — the OS desktop blobs, a media
frame, a hero image, or an explicit blob layer (`--desktop-blob-primary` /
`--desktop-blob-secondary`, the `showcase.tsx:893-898` pattern). On a flat opaque
page, use `variant="solid"` (the default) or `variant="inset"`.

**2. Two valid usage patterns (documented, copy-pasteable):**

- **Chrome glass (overlay).** Dialog, Sheet, Popover, DropdownMenu, Command
  palette, Toast, OS `Window`/titlebar, topbar, dock, sidebar rail. These are
  valid by construction: Radix renders them above a scrim (`bg-overlay`) or above
  the OS desktop, so there is always a backdrop. No extra work at the call site.
- **Feature/hero glass card.** A glass card used for a hero or a feature tile in a
  bento/dashboard. Valid **only** when wrapped in a container that carries a blob
  backdrop:
  ```tsx
  <div className="relative overflow-hidden rounded-2xl border bg-background p-4">
    <div aria-hidden className="absolute inset-0 overflow-hidden">
      <div className="absolute -top-24 -left-16 size-80 rounded-full bg-(--desktop-blob-primary) opacity-55 blur-3xl" />
      <div className="absolute -right-12 -bottom-24 size-80 rounded-full bg-(--desktop-blob-secondary) opacity-50 blur-3xl" />
      <div className="absolute inset-0 bg-background/30" />
    </div>
    <div className="relative">
      <Card variant="glass">…</Card>
    </div>
  </div>
  ```
  Keep the content light (a headline, a CTA, a metric) — not a form or a data
  table. This is the pattern the `/design-system` showcase already uses.

**3. Banned anti-patterns.**

- Glass card (or `glass-panel` utility) directly on a flat page background, with
  no backdrop layer. Use `variant="solid"`.
- Glass card carrying dense content: forms, long text, tables, lists. The
  `backdrop-filter` cost buys no legibility gain and the APCA margin shrinks; use
  a solid card. Forms especially — inputs already have their own opaque `--field`
  fill, so a glass form is a contrast hazard.
- More than 2 nested glass layers (already enforced by the CSS soft-guard +
  `glass-performance.test.ts`; restated here because it is the same discipline).

**4. Migration of existing violations.** The three production `Card variant="glass"`
sites (watch-lobby Create/Join forms ×2, side-dock panel) sit on flat backgrounds
with form/chrome content. They are migrated to `variant="solid"` (forms) or given a
backdrop (chrome) in the implementation that lands with this ADR.

**5. Surface rules unchanged.** No new token, no value change, no rename. The
APCA gate (`glass-contrast.test.ts`), the rim pair (`glass-rim.test.ts`), and
the perf guard (`glass-performance.test.ts`) all stand exactly as ADR-0014
left them. (Note: `glass-sheen.test.ts` was later removed by ADR-0016.)

## Consequences

**Positive:**

- Glass reads as glassmorphism wherever it appears, because every glass surface is
  guaranteed a refracting backdrop. The "washed-out grey box" failure mode is
  removed at the rule level.
- Dense content stays on solid cards where the APCA margin is comfortable and
  there is no `backdrop-filter` cost — the performance budget the drift guards
  protect is reinforced by usage, not just by CSS.
- The rule is teachable and copy-pasteable: the two patterns above are the entire
  surface; anything else is a solid card.

**Negative / costs:**

- The rule is enforced by review + the design-system/skill prose, not by a
  deterministic test. A regex/AST guard that proves "glass is always inside a
  backdrop container" is brittle (sibling glass reads as nested; backdrop can come
  from a page-level wrapper, not a parent). The drift guards cover the hard
  ceiling (perf, contrast); this ADR covers the soft usage floor. The
  `/design-trends` page becomes the living reference for the rule.
- Glass loses ~3 call sites that were (mis)using it for visual flair on flat
  pages. If a future hero page wants glass over a flat background, it must add a
  blob layer first — one extra wrapper per surface.

**Neutral:**

- ADR-0014 and ADR-0012 are **supplemented, not amended or superseded**: their
  visual treatment and structural decisions are untouched. This ADR adds exactly
  one precondition (backdrop) to the usage of an unchanged surface vocabulary.
- Token tier count, public API names, and the drift-guard set are all unchanged.

## Alternatives considered

- **Do nothing; let the showcase example carry the rule.** Rejected: three
  production sites already violate it, and the showcase meant to teach it
  (`/design-trends`) violates ~30 design-system rules itself. Prose in a skill
  that the violators did not load is not a rule.
- **Add a `glass-soft` sub-variant for content cards on a light backdrop.**
  Rejected: it inverts the 2026 guidance (content density + glass = worse
  legibility at higher GPU cost), adds a token the APCA gate would have to
  re-verify, and does not fix the root cause (missing backdrop). The solid card
  already solves the content-card case.
- **Add a deterministic test that fails when `variant="glass"` is not inside a
  backdrop container.** Rejected as brittle: a backdrop can be supplied by a
  page-level wrapper (not a parent element), sibling glass surfaces read as nested
  to a naive walker, and the OS-desktop case has no container at all. The hard
  ceiling (perf/contrast) stays test-guarded; the usage floor stays review-guarded
  + taught by the gold-reference `/design-trends` page.
- **Ban `variant="glass"` on `Card` entirely; force `GlassSurface` only.**
  Rejected: the two valid patterns (chrome overlay + feature/hero card) both need
  a card-shaped surface with header/content/footer slots. `GlassSurface` is a raw
  surface; `Card variant="glass"` is the right composition tool. The problem is
  usage, not the variant.

## References

- `docs/adr/0014-glassmorphism-surface-treatment.md` — the visual treatment this
  ADR supplements (backdrop precondition only; no value change).
- `docs/adr/0012-engineered-glass-surface-language.md` — the "glass only for
  floating layers" structural decision this builds on.
- `docs/conventions/design-system.md` — hard surface rules (updated to carry the
  backdrop requirement).
- `apps/web/src/app/(app)/design-system/showcase.tsx:893-898` — the canonical
  2-blob backdrop pattern a feature/hero glass card must wrap in.
- `apps/web/src/app/(app)/design-trends/page.tsx` — promoted to the gold-reference
  teaching page for this rule (backdrop on/off toggle, APCA readout).
- `apps/web/src/test/design-system/glass-performance.test.ts` — the perf ceiling
  (no animated `backdrop-filter`, scoped `will-change`, stacked-glass soft-guard).
- `apps/web/src/test/design-system/glass-contrast.test.ts` — the APCA gate
  (unchanged; `--glass-tint` must stay a single colour, never a gradient).

### External 2026 references

- Josh Comeau — "Next-level frosted glass with `backdrop-filter`":
  https://www.joshwcomeau.com/css/backdrop-filter/
- Chrome for Developers — "CSS `prefers-reduced-transparency`":
  https://developer.chrome.com/blog/css-prefers-reduced-transparency
- Can I Use — `@media/prefers-reduced-transparency`:
  https://caniuse.com/mdn-css_at-rules_media_prefers-reduced-transparency
- UXPilot — "12 Glassmorphism UI Features, Best Practices, and Examples":
  https://uxpilot.ai/blogs/glassmorphism-ui
- Figr — "Glassmorphism: The Complete Guide to Frosted Glass UI Design":
  https://figr.design/blog/glassmorphism-0e8b1
