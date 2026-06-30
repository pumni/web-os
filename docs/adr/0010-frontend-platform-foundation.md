# 0010. Frontend Platform Foundation — `@pumni/ui` as a Reusable OS Skeleton

- **Status:** Accepted (two rejections revised by ADR-0021)
- **Date:** 2026-06-20
- **Owner:** Design system / `@pumni/ui`

> **Update (ADR-0021, 2026-06-30):** the *Storybook* and *Style Dictionary /
> DTCG* rejections below are reopened by `docs/adr/0021-revisit-platform-rejections.md`.
> The *WCAG 2.x* rejection stands — Pumni OS remains APCA-only.

## Context

Pumni Web OS is not a single product. It is an **OS-style skeleton**: a frontend
platform where features (the watch-together hub being the first) are built *on
top of* a reusable shell, with the explicit goal that the same foundation can
seed **future, unrelated projects**. That reframing changes what "good frontend
architecture" means here — the bar is portability and multi-project reuse, not
just shipping one app.

We evaluated the project against an external reference, the *Enterprise UI
Platform Architecture Blueprint (mid-2026)*. The audit found Pumni already meets
or exceeds most of it:

- Bun + Turborepo monorepo; Next.js 16.2.9; React 19.2; Tailwind v4; `radix-ui`
  unified primitives — matching the blueprint's stack exactly.
- A three-tier OKLCH token system (`packages/ui/src/styles/tokens.css` →
  `theme.css` → component vars), documented in `docs/conventions/design-system.md`.
- `forwardRef` effectively eradicated (ref-as-prop via `ComponentProps`); the UI
  package has zero `forwardRef`, one residual remains in a feature.
- Data-attribute scoped theming (`data-accent` / `data-glass` / `data-density`)
  with a pre-paint FOUC script in
  `packages/ui/src/components/personalization-provider.tsx` — the blueprint's
  "scoped CSS variables, zero-JS repaint" pattern, already implemented and more
  granular than the blueprint describes.
- A correct **APCA** implementation (`packages/ui/src/lib/apca.ts`, spec
  0.0.98G-4g) gated by `apps/web/src/test/design-system/glass-contrast.test.ts`
  across light/dark × four accents — ahead of the WCAG 2.x ratio most systems
  still use.

So the work is **not** "adopt the blueprint." It is: identify the few decisions
that turn an already-strong design system into a *portable platform*, and
explicitly reject the blueprint items that are enterprise tax for our context
(no Figma-designer pipeline, no multi-team docs surface, no RTL roadmap yet).

Three architectural tensions block reuse today:

- **A — `@pumni/ui` mixes three concerns.** Generic headless primitives
  (Button, Input, Dialog…), Pumni *identity* (glass, motion, personalization,
  tokens), and OS-shell components (Window, Dock, BentoGrid, `desktop.css`) all
  live in one flat `components/` directory exported through a single barrel
  (`packages/ui/src/index.ts`, `exports: { ".": "./src/index.ts" }`). A future
  non-OS project wants the primitives and identity but not the desktop shell,
  and cannot express that with the current barrel.
- **B — Brand is hardcoded into the semantic layer.** `theme.css` binds
  `--primary: var(--cyan-600)` directly. A new project with a different brand
  hue must edit the platform's core semantic file — the wrong layer to touch.
- **C — APCA is a test gate, not a guarantee by construction.** The contrast
  test *catches* violations after colors are hand-tuned. That holds for one
  brand; for N brands across N projects it forces manual color-hunting per brand
  and hopes the gate stays green. We already own `apcaContrast`; we do not yet
  own its inverse (derive a foreground that hits a target Lc for a given
  background).

## Decision

Lock three foundational moves, in this priority order, and three deliberate
rejections. This ADR records the **why**; each move ships in its own follow-up
change with its own gate.

**1. Brand-contract layer (enables multi-project).**
Insert a thin brand-token indirection *above* the semantic layer. The semantic
layer reads brand abstractions with a Pumni-default fallback rather than
pointing at a primitive directly:

```css
/* theme.css reads an abstraction; cyan stays the Pumni fallback */
--primary: var(--brand-primary, var(--cyan-600));
```

A consuming project overrides `--brand-primary` (and siblings) at `:root` or a
project-scoped `data-brand` attribute — reusing the exact mechanism
`PersonalizationProvider` already proves with `data-accent`. Brand becomes a
**project-level input**, not a core edit. The token tier count stays three
(`docs/conventions/design-system.md` "do not exceed three"): the brand contract
is the entry surface of Tier 2, not a fourth tier.

**2. Inverse-APCA generator (APCA as guarantee, not just gate).**
Add `foregroundFor(bg, targetLc)` (and the dual `backgroundFor`) in
`packages/ui/src/lib`, implemented as a binary search over the OKLCH lightness
axis calling the existing `apcaContrast`. New brands derive accessible
foregrounds **by construction** instead of by hand-tuning. The existing
`glass-contrast.test.ts` stays as the safety net — but now rarely fires, because
generated colors satisfy it up front. Targets remain the project's current
standard: Lc 60 text / Lc 25 UI (no WCAG 2.x ratio gate is added — see
`design-system.md`).

**3. Granular `exports` map (enables tree-shaking + concern boundaries).**
*Augment* (not replace) the barrel with an explicit `exports` map that surfaces
the three concerns as import namespaces, e.g. `@pumni/ui/button` (primitive),
`@pumni/ui/glass-surface` (identity), `@pumni/ui/os/window` (shell). The
OS-shell components (Window, Dock, BentoGrid) move into `components/os/` so the
split is structural, not just naming. The root barrel (`.`) is kept as a
convenience facade for the existing app — already tree-shaken by Next's
`optimizePackageImports: ['@pumni/ui']` — so the 65 existing barrel import sites
are untouched. The new subpaths are the explicit, tree-shakeable public surface
a *second* project consumes; they make the primitive/identity/shell split
visible in import paths and let a consumer pull primitives without dragging in
the OS shell.

(Implementation note: the original "replace the barrel" framing was softened to
"augment" once the cost was measured — a literal replace meant rewriting 65
multi-concern import lines across the app for no consumer benefit, since the app
is itself a valid barrel consumer and already tree-shaken. The subpath exports
deliver every stated benefit additively.)

**Deliberately rejected (for now):** *(Storybook + Style Dictionary/DTCG revised
by ADR-0021; WCAG rejection stands.)*

- **No Style Dictionary / DTCG / Figma pipeline.** It pays off only with a
  designer authoring Figma Variables and multiple brands fed from design. We
  have neither. Hand-authored OKLCH CSS plus the in-house inverse-APCA generator
  (Decision 2) covers our needs without the pipeline's build and maintenance
  cost.
- **No Storybook (`apps/storybook`).** Its primary value is cross-team
  communication and isolated docs. With a solo/small team and existing
  visual-regression + contrast tests, it adds a second app to maintain for
  marginal gain. Re-open when a second human consumer of the component library
  exists.
- **No package split (`@pumni/os-shell`) yet.** Splitting before a second
  project actually diverges is premature. The granular `exports` map (Decision
  3) gives the concern boundary now; promote `os/*` to its own package only when
  a real second consumer needs a different shell.

RTL / CSS logical properties are out of scope for this ADR: no i18n/RTL roadmap
exists. The blueprint's logical-property mandate is noted as a future trigger,
not adopted.

## Consequences

**Positive:**

- A new project can rebrand by overriding `--brand-*` tokens without editing
  platform core, and gets accessible foregrounds generated for that brand.
- APCA shifts from after-the-fact gate to correct-by-construction; per-brand
  manual color-hunting disappears.
- Import paths express the primitive / identity / shell boundary, improving
  tree-shaking and making the eventual package split mechanical.
- The blueprint is consumed selectively and on the record, preventing future
  re-litigation ("why no Storybook / Style Dictionary / RTL?").

**Negative / costs:**

- The brand-contract layer adds one indirection between semantic tokens and
  primitives; readers of `theme.css` must understand the `var(--brand-*, …)`
  fallback idiom. Mitigated by keeping cyan as the visible default.
- The granular `exports` map must be maintained as components are added; a new
  component without an export entry is unreachable. A barrel was lower-friction
  for adders. Mitigated by treating the map as part of the component-authoring
  contract.
- `foregroundFor` introduces a derivation that must itself be tested for
  convergence and edge cases (near-black clamp, out-of-gamut targets).

**Neutral:**

- Token tiers stay at three; no new conceptual layer is introduced.
- `glass-contrast.test.ts` is unchanged in intent; its role shifts from primary
  enforcement to regression safety net.

## Alternatives considered

- **Adopt the Enterprise blueprint wholesale.** Rejected: ~70% is already
  implemented, and the remainder (Style Dictionary, Storybook, RTL, multi-brand
  runtime theme providers) targets an enterprise context — Figma-driven design,
  multi-team docs, global i18n — that Pumni does not have. Importing the cost
  without the context is net-negative. (Mirrors ADR-0001's decline of the
  Enterprise AI Context blueprint.)

- **Keep brand hardcoded; fork `theme.css` per project.** Rejected: forking the
  platform's core semantic file per consumer is exactly the coupling a reusable
  skeleton must avoid; it guarantees drift across projects.

- **Keep APCA as a test-only gate.** Rejected for the multi-project goal: a gate
  tells a brand author they failed but not what value to use; it scales poorly to
  N brands. Generation subsumes checking.

- **Split into `@pumni/ui` + `@pumni/os-shell` now.** Rejected as premature: no
  second consumer exists, so the split would be designed against a guessed
  boundary. The `exports` namespace captures the boundary reversibly until a real
  divergence justifies the package overhead.

- **Replace the barrel entirely (rewrite all 65 import sites).** Rejected once
  the cost was measured: the app is itself a valid barrel consumer, already
  tree-shaken by `optimizePackageImports`, so rewriting 65 multi-concern import
  lines buys no consumer benefit while adding large mechanical churn and merge
  risk. The barrel is kept as a convenience facade *alongside* the new explicit
  subpaths — the subpaths, not the barrel's removal, are what deliver the
  concern boundary and tree-shakeable public surface for a second project.

## Amendment (Mid-2026)

**Root Barrel Removal:** Contrary to the initial decision to keep the root barrel as a convenience facade, the root barrel export has been completely removed from `packages/ui`'s `exports` map, and all client imports have been migrated to subpaths. This guarantees absolute concern boundaries, prevents any implicit loading of OS-shell components, and ensures bulletproof tree-shaking across all consuming applications without depending on Next.js/bundler-specific configuration (`optimizePackageImports`).

## References

- `docs/conventions/design-system.md` — token tiers, surface rules, APCA targets
  (canonical owner; this ADR must not contradict it).
- `packages/ui/src/lib/apca.ts` — `apcaContrast`, the basis for Decision 2.
- `packages/ui/src/components/personalization-provider.tsx` — the data-attribute
  theming mechanism reused by Decision 1.
- `packages/ui/src/styles/theme.css` — semantic layer that gains the brand
  contract.
- `apps/web/src/test/design-system/glass-contrast.test.ts` — the APCA safety net.
- `docs/adr/0001-structured-prompting-and-model-routing.md` — precedent for
  selectively declining an enterprise blueprint.
