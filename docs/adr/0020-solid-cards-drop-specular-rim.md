# 0020. Solid Cards Drop the Specular Top Rim

- **Status:** Accepted
- **Date:** 2026-06-21
- **Owner:** Design system / `@pumni/ui`

## Context

[ADR-0018](0018-unify-surface-rim-top.md) unified the "lit top rim" concept into
one token — `--surface-rim-top` — and made it the **shared seam** between glass
and solid surfaces: every `glass-*` utility AND `surface-raised` (solid cards)
read the same inset `0 1px 0 0 var(--surface-rim-top)`. The intent was to kill
drift between the two previously-split tokens (`--glass-highlight` vs
`--card-rim-top`).

A border-flow audit (the one that produced [ADR-0019](0019-border-consumption-flow.md))
surfaced an unintended consequence: because the solid card carries **both** a
dark structural hairline (`--border`) **and** a white specular top rim
(`--surface-rim-top`), two of ADR-0019's three border concepts are stacked on
the same element. On a flat background this reads close to glassmorphism — a
solid card gets a luminous top edge that belongs to the glass vocabulary, which
is exactly the confusion ADR-0019's decision tree exists to prevent:

> SOLID surface → structural hairline only, no specular rim.

ADR-0019 documented the *target* flow but did not change `surface-raised` — the
solid card still carried the rim. This ADR closes that gap: make the code match
the documented contract.

The glass identity is **not** in question. Glass surfaces legitimately need the
specular rim — it is half of the volumetric edge pair that makes frosted glass
read as a lit object (ADR-0014). The 8 `glass-*` utility sites in `glass.css`
keep `--surface-rim-top`. Only the solid half of ADR-0018's seam is dropped.

## Decision

**Remove the specular top rim from `surface-raised`.** Solid cards become
structural-only:

```css
/* before (ADR-0018) */
@utility surface-raised {
  box-shadow:
    var(--shadow-card-raised),
    inset 0 1px 0 0 var(--surface-rim-top);
}

/* after (this ADR) */
@utility surface-raised {
  box-shadow: var(--shadow-card-raised);
}
```

A solid card now carries exactly: a dark `--border` hairline (structural
delineation) + `--shadow-card-raised` (elevation). No specular rim, no inset
highlight — it reads as a crisp structural surface, visually distinct from glass.

`--surface-rim-top` **stays defined** in `:root` and `.dark` and is still
consumed by every `glass-*` utility. The token is glass-owned again; only its
name (surface-agnostic) is retained from ADR-0018. The drift guard
`glass-rim.test.ts` is untouched — it asserts glass utilities, which are
unchanged.

### What changes

- `packages/ui/src/styles/theme.css` — `@utility surface-raised` drops the inset
  rim line; comment updated to "structural-only, specular rim is glass-only".
- `packages/ui/src/styles/tokens.css` — `--shadow-card-raised` comment updated
  to note the rim is no longer applied in `surface-raised`.
- `apps/web/src/test/design-system/border-consumption.test.ts` — the positive
  assertion ("surface-raised reads --surface-rim-top") is **inverted** to a
  negative one ("surface-raised does NOT carry the specular top rim"). The
  `:root`/`.dark` "defines --surface-rim-top once" guard and the glass rim
  guards stay — the token still exists for glass.

### Scope boundary (deliberately out of scope)

- **Glass utilities are untouched.** All 8 `glass-*` sites keep
  `--surface-rim-top`. Glass is the legitimate home of the specular rim.
- **`--surface-rim-top` token is not deleted or renamed.** It is glass-owned
  now, but the surface-agnostic name from ADR-0018 is kept — renaming back to a
  `--glass-*` name would be churn across 8 sites + 2 tests for no benefit, and
  the name still reads correctly ("the lit top rim of a [glass] surface").
- **Solid card bottom rim.** Solid cards have never carried a bottom rim
  (`--glass-shadow-edge` is glass-only by ADR-0018 scope). Still out of scope.

## Consequences

**Positive:**

- The solid/glass visual boundary is sharper. A solid card reads as crisp and
  structural; glass reads as luminous and floating. This is the contract
  ADR-0019 documented but the code did not yet enforce.
- `surface-raised` is simpler — one box-shadow layer, no inset. Easier to reason
  about, easier to override for a rebrand.
- The drift guard now pins the contract: a future edit that re-adds the rim to
  `surface-raised` fails the `border-consumption` test.

**Negative / costs:**

- **Visible change to every solid card.** `Card variant="solid"` (the default),
  `Card variant="spotlight"`, `IconBadge tone="raised"`, and 2 ad-hoc
  `surface-raised` usages lose their lit top edge. The change is subtle (a 1px
  white inset at 0.5/0.2 alpha) but perceptible on close inspection,
  particularly in dark mode where the rim was 0.2.
- **ADR-0018's "shared seam" is partially reversed.** ADR-0018 unified the rim
  across glass + solid; this ADR drops the solid half. ADR-0018 is amended, not
  superseded — its glass half and the drift-prevention rationale still stand.
  Recorded so a future reader does not re-propose re-unifying without weighing
  the visual-confusion cost this ADR was opened to fix.

**Neutral:**

- No token is deleted; tier count stays three. `--surface-rim-top` moves from
  "shared" to "glass-owned" in consumption, not in definition.
- No public API change (`Card`, `IconBadge`, `surface-raised` keep their names
  and props). Component TSX is untouched.
- APCA gate unaffected: rim tokens are specular/ungated by ADR-0014 design.

## Alternatives considered

- **Keep the rim on solid; soften the alpha instead.** Rejected: the problem is
  not the alpha value, it is the *concept* — a specular highlight does not
  belong on a structural surface. Softening 0.5 → 0.3 would make the rim less
  visible but would not resolve the solid-reads-like-glass confusion; it would
  just hide it. ADR-0019's contract is "solid = structural only," and this ADR
  makes the code say that.
- **Give solid its own darker rim token (e.g. a `--solid-rim-top` at low
  alpha).** Rejected: this re-creates the exact two-token drift ADR-0018 was
  opened to kill. If a solid rim is ever wanted again, it goes through its own
  ADR with its own rationale — not a silent re-introduction.
- **Drop `--surface-rim-top` from glass too (kill the rim concept entirely).**
  Rejected: glass *needs* the specular rim — it is half the volumetric edge pair
  (ADR-0014) that makes frosted glass read as glass. Removing it would flatten
  the glass identity the 0012 → 0014 → 0016 sequence built.
- **Rename `--surface-rim-top` back to a `--glass-*` name now that it is
  glass-only.** Rejected as churn: 8 glass.css sites + 2 tests + 3 ADRs reference
  the current name, and "surface-rim-top" still reads correctly for a glass
  surface. The rename would touch more files than this decision for no
  functional gain.

## References

- `packages/ui/src/styles/theme.css` — `@utility surface-raised` drops the inset
  rim; comment updated.
- `packages/ui/src/styles/tokens.css` — `--shadow-card-raised` comment updated.
- `apps/web/src/test/design-system/border-consumption.test.ts` — rim assertion
  inverted (solid must NOT read `--surface-rim-top`); glass rim guards unchanged.
- [ADR-0018](0018-unify-surface-rim-top.md) — amended: the solid half of the
  shared seam is dropped; glass half stands.
- [ADR-0019](0019-border-consumption-flow.md) — the border-consumption contract
  this ADR makes the code enforce (solid = structural only).
- [ADR-0014](0014-glassmorphism-surface-treatment.md) — the glass rim pair this
  ADR leaves untouched.
