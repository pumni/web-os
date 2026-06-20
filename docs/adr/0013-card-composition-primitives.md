# 0013. Card Composition Primitives

- **Status:** Accepted
- **Date:** 2026-06-20
- **Owner:** Design system / `@pumni/ui`

## Context

`Card` (`packages/ui/src/components/layout/card.tsx`) is well-formed — slot
pattern (`data-slot`), `cva` variants (`solid`/`inset`/`glass`/`spotlight`),
`asChild`/Slot, token-first — and its glass treatment was modernized in
ADR-0012. The drift was **not** in the core component but in the **consumption
layer**: after several refactors three parallel "card systems" coexisted, and a
survey found **43 ad-hoc surfaces across 26 files**.

The three systems:

- **`Card` slots** — the watch feature cards (`room-card`, `recent-rooms-card`,
  `empty-rooms-card`). Correct.
- **`BentoGridItem`** — the whole dashboard. It wrapped `Card` but defined its
  **own** content slots (icon/title/description/header) with different padding
  (`p-5 lg:p-6`) and gap (`gap-4`) than `Card` (`py-6`/`px-6` + `gap-6`), so a
  bento tile and a feature card read as structurally different cards.
- **Ad-hoc inline** — hand-rolled `rounded-* border bg-{card,muted} p-N` blocks
  that went through no component.

Measured drift: the inset well was re-invented ~10 times with inconsistent
radius/padding even though `Card variant="inset"` existed; the status pill
(`border border-success/20 bg-success/10 …` + ping dot) was duplicated ~15 times
with no component; the icon chip (`inline-flex size-N rounded-lg bg-primary/10
text-primary`) recurred across cards; interactive cards had three different
hover treatments. The existing `pumniNoAdHocSurface` lint rule
(`packages/config/eslint.mjs`) caught `bg-card/NN` opacity, raw `backdrop-blur`,
and raw `shadow-lg/xl/2xl`, but **not** the re-invented well/pill — so this drift
was unguarded.

The root cause: missing **sub-surface primitives**, so consumers re-built them;
plus a lint rail that did not cover the re-invention.

## Decision

Keep `Card` as the single block-level surface (do **not** add a competing
`Surface` primitive) and add a small, orthogonal, **composition-first** set of
sub-surface primitives, then enforce them.

**1. Three new primitives in `@pumni/ui` (server-safe, `cva`, token-only):**

- **`CardWell`** (`layout/card-well.tsx`) — the canonical recessed inset well
  (`border border-border bg-muted`), lightweight (no Card block padding/gap),
  with `radius` (md/lg/xl) and `padding` (none/sm/md/lg) variants and
  concentric-radius support via `--parent-radius`. Replaces the hand-rolled
  `rounded-* border bg-muted p-N` wells.
- **`Badge`** (`feedback/badge.tsx`) — the status-tint pill with a `tone`
  (`neutral|primary|success|warning|destructive`) and an optional `pulse` dot
  that inherits the tone via `bg-current`. Replaces the duplicated status pills.
- **`IconBadge`** (`layout/icon-badge.tsx`) — the rounded icon chip with `tone`
  (`primary-soft|raised|muted`), `size` (sm/md/lg/xl), and `radius`. The
  `raised` tone uses the owned `surface-raised` utility instead of a raw
  `border bg-card shadow-card`.

**2. `BentoGridItem` becomes layout-only.** It keeps tier/span responsibility but
renders its icon through `IconBadge` and its header well through `CardWell`, so a
bento tile and a feature card share one surface vocabulary.

**3. Migrate the consumption layer.** Dashboard (`dashboard-bento`,
`dashboard-header-card`) and watch room cards (`room-card`,
`recent-rooms-card`, `empty-rooms-card`) move onto the primitives. `room-card`
also uses `Card asChild` so the `Card` *is* the `<a>` (one focus ring, no nested
interactive) and drops its hand-rolled hover wash in favour of the `interactive`
variant.

**4. Extend the lint rail.** `pumniNoAdHocSurface` gains a pattern for the
shorthand inset well — `(?<!-)\bborder bg-muted\b` — that flags the ad-hoc form
while the negative lookbehind excludes the canonical `border border-border
bg-muted` the primitives use. Files not yet migrated (sky-player, the larger
watch panels) are listed in the rule's `ignores` with a follow-up TODO, matching
the rule's existing "migrate in follow-up passes" convention; the migrated card
surfaces are enforced now.

## Consequences

**Positive:**

- One surface vocabulary across dashboard, watch, and Bento; consumers never
  hand-roll `border bg-muted` wells, status pills, or icon chips.
- The lint rail now blocks the specific drift that produced the 43 ad-hoc
  surfaces, so it cannot silently re-accumulate in migrated files.
- `room-card` is a single accessible anchor (no nested `Link` + `Card`), and
  interactive feedback is unified on the `Card interactive` variant.

**Negative / costs:**

- The new well-ban needs a `ignores` list for not-yet-migrated files
  (sky-player, watch panels, a few chips); those still hand-roll wells until a
  follow-up pass migrates them and removes the ignore entries.
- `Badge tone="neutral"` is `bg-muted`, so a neutral badge placed *inside* a
  `CardWell` (also `bg-muted`) relies on its `border-border` for separation —
  acceptable, but worth knowing when composing.

**Neutral:**

- No new tokens and no token-tier change — the primitives consume existing
  semantic utilities (`bg-muted`, `surface-raised`, the status-tint pattern).
- `Card` itself is unchanged; this is purely an additive sub-surface layer.

## Alternatives considered

- **Add a single `Surface` primitive with a `role` variant.** Rejected: `Card`
  already owns block-level surface roles via `variant`; a second surface
  primitive would be a fourth parallel system, the exact problem being fixed.
- **Promote `Card variant="inset"` for every well (no `CardWell`).** Rejected:
  `Card` carries heavy block padding/gap and slot semantics; using it for a
  small media row or stat well is overkill. `CardWell` is the lightweight peer.
- **Ban `border bg-card` as well as `border bg-muted` in lint.** Rejected for
  now: `border bg-card` is a legitimate raised chip/code-pill pattern (e.g. the
  room-code chip), and a broad ban would force awkward conversions. The well
  re-invention (`bg-muted`) is the measured drift; scope the rule to it.
- **Migrate all 16 remaining `border bg-muted` files in this pass.** Deferred:
  the dashboard + watch cards are the core of the redesign; the larger watch
  panels and sky-player suite are a follow-up, tracked by the lint `ignores`
  TODO so enforcement lands as each migrates.

## References

- `docs/conventions/design-system.md` — surface vocabulary + anti-slop table
  (the closed card sub-surface set) this ADR must not contradict.
- `packages/ui/src/components/layout/card-well.tsx`,
  `packages/ui/src/components/layout/icon-badge.tsx`,
  `packages/ui/src/components/feedback/badge.tsx` — the new primitives.
- `packages/ui/src/components/os/bento-grid.tsx` — `BentoGridItem` rendering
  through the primitives.
- `packages/config/eslint.mjs` — `pumniNoAdHocSurface` well pattern + ignores.
- `.agents/skills/ui-styling/SKILL.md` + `REFERENCE.md` — surface vocabulary
  tables updated with the primitives.
- `docs/adr/0012-engineered-glass-surface-language.md` — the surface identity
  (`surface-raised`, glass roles) this composition layer sits on.
- `docs/adr/0010-frontend-platform-foundation.md` — `@pumni/ui` as a reusable
  OS skeleton.
