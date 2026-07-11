# Plan: Glass system standards refresh 2026-07 (targeted, not a rewrite)

- **Status:** Draft — awaiting approval (plan approval gate, `refactor-plan` §3)
- **Date:** 2026-07-11
- **Owner:** `@pumni/ui` design system + production glass consumers
- **Skills used:** `refactor-plan` (this plan) · `ui-styling` + `testing-template` (per-step)
- **Research basis:** `docs/research/glass-effect-modern-standards-2026-07.md`
  (30 primary sources fetched 2026-07-11: W3C CSS Color 4/5/6 + Filter Effects 2,
  MDN, Myndex/APCA, apcach/Color.js, Apple HIG Materials + Liquid Glass +
  WWDC25 §219, Chrome/web.dev)
- **Predecessors (shipped — do NOT redo):**
  `glass-modernization-relative-apca-2026-07` (relative `--glass-fill` SSOT,
  soft/strong APCA) · `glass-modern-standard-hardening-2026-07` (a11y wiring)
  · `glass-unification-modern-system-2026-07` (optical/API unification) ·
  `glass-border-doctrine-and-grain-2026` (edge doctrine) · ADR-0021 (Liquid
  Glass lensing **rejected**, settled) · ADR-0025 (CSS-native color pipeline)

---

## Outcome (one sentence)

Close the six verified gaps between the shipped glass system and the 07/2026
research baseline — fallback-block drift risk, dead alias debt, unbounded
media-floating contrast, missing scroll-edge separation, a pixel-verified
clipped bevel ring, and stylesheet cohesion debt — as independent PR-sized
phases, **without** reopening settled rejections or rewriting the healthy core.

## Why not a rewrite (audit verdict)

The current system already implements the research baseline; a rewrite would
destroy verified, gated work. Evidence per research §:

| Research requirement | Current implementation | Status |
| --- | --- | --- |
| OKLCH token pipeline, `light-dark()`, relative color from one fill SSOT (§3) | `theme.css:164-170` `--glass-fill` → chrome/readable derive alpha only; ADR-0025 resolver | ✅ shipped |
| APCA gate with alpha-composited worst-case backdrop (§4.3) | `glass-contrast.test.ts:50-82` composites glass over blobs **including saturate/brightness filter simulation** — exceeds the research recommendation | ✅ shipped |
| Lc floors: 60 chrome/short text, 75+ body on solid insets (§4.2) | Gate header `glass-contrast.test.ts:84-98` (APC-RC Bronze); body text banned from bare glass by doctrine decision tree | ✅ shipped |
| Inverse-APCA token derivation (apcach pattern, §4.3) | `packages/ui/src/lib/apca.ts` `foregroundFor`/`backgroundFor` bisection | ✅ shipped |
| Reduced-transparency / contrast / forced-colors / `@supports` degradation (§5.5, §6) | `glass.css:244-338` four fallback layers + in-app preview + `glass-a11y-fallbacks.test.ts` | ✅ shipped |
| Perf: never animate backdrop-filter, will-change scoped, blur cap, ≤2 stacked layers (§6) | `glass-performance.test.ts` static audits; `translateZ(0)` promotion | ✅ shipped |
| Glass = floating navigation layer only, never content, no glass-on-glass (§5.3) | design-system.md decision tree + `border-consumption` / stack-budget audits | ✅ shipped |
| Liquid Glass lensing/refraction | **Deliberately rejected** (ADR-0021; `glass.css:13-14` header) for web GPU cost + text clarity | ✅ settled — non-goal |
| Scroll edge effect (§5.3.4) | **Absent** — sticky `glass-bar-edge-b` topbar has no scrolled-content edge treatment (repo-wide grep: 0 hits) | ❌ Gap G4 |
| Clear-variant-over-media needs bounded dimming (§5.2) | Watch surfaces (`room-controls.tsx:461`, `watch-room.tsx:341`) float over arbitrary video; gate declares near-white/black "invalid glass contexts" (`glass-contrast.test.ts:145-146`) but video can be exactly that | ❌ Gap G3 |
| Single-point fallback maintenance (§6 recipe shape) | Six fallback blocks repeat the same 6-selector list (`glass.css:244-376`) — adding a 7th utility requires 6 manual edits | ⚠️ Gap G1 (drift hazard) |
| Closed public surface, no dead vocabulary | `--glass-tint` alias + `--color-glass`/`--color-glass-border` Tailwind mappings (`theme.css:170,333-334`) have **zero** production class consumers (repo-wide grep) | ⚠️ Gap G2 (debt) |
| Specular rim renders as designed (§6 step 3 rim; border doctrine `REFERENCE.md:180`) | **Bevel ring is clipped by `overflow: hidden`** — `::before` at `inset: -1px` draws in the border band, outside the padding-box clip. Pixel-verified 2026-07-11 (Playwright/Chromium: prod ≠ control; only corner antialiasing crumbs survive). Doctrine calls this ring the glass structural hairline; in reality the perceived edge comes from the inset bezel pair + drop shadow | ❌ Gap G5 (bug — doctrine/reality divergence) |
| Stylesheet cohesion at the consumption layer | `glass.css` §3–4 host non-glass vocabulary (focus-ring, `state-*`, skeleton, card-spotlight, text-gradient-brand, shimmer, rounded-nested) — the file name lies to navigation | ⚠️ Gap G6 (cohesion debt, optional) |

**Consumption-layer taxonomy verdict (asked 2026-07-11):** Card should **not**
split into two components. The split that matters — content-solid vs
floating-glass — already exists at component level (`Card` vs `GlassSurface`)
and is pinned by `glass-optical-unity.test.ts` ("cardVariants has no glass
keys"). Within `Card`, `variant`/`interactive`/`state`/`radius` are orthogonal
cva axes over one opaque base surface (industry-standard shadcn/M3 shape);
splitting by interactivity would duplicate the base surface, churn every
call-site, and add nothing the closed variant set doesn't already enforce.
Recorded in the Decision Log.

## Non-goals (hard fence)

- **No Liquid Glass lensing / SVG displacement refraction.** ADR-0021 settled
  this; reopening requires a new ADR, not this plan.
- **No `color-mix()` interpolation-space migration (`in oklch` → `in oklab`).**
  Research §2.3: premultiplied alpha makes mixes-with-transparent safe in any
  space; remaining mixes are between near-neutral fills where the hue-arc
  difference is invisible; `token-resolver.ts` grammar (ADR-0025 §3) would need
  an expansion whose cost exceeds the benefit. Recorded here so future agents
  stop re-proposing it.
- **No `contrast-color()` / `color-layers()` adoption** — CSS Color 6 is
  "Not Ready For Implementation" (research §2.4). APCA library gate stays the
  authority.
- **No new glass tiers** beyond the closed set, except the single G3 decision
  (media dim pairing) explicitly scoped below.
- **No changes to** `supabase/`, feature business logic, motion vocabulary,
  personalization API, blur ladder values, or the 2-layer stack cap.
- **No commits/pushes** unless the user asks (repo default).

## Constraints & invariants

- P0–P4 win over this plan. APCA (`glass-contrast.test.ts`) remains the gating
  authority for every color change; WCAG2 bridge stays non-gating.
- Refactor phases (A, B) must be behavior-preserving — built CSS may change
  textually but computed styles must not. Behavior-changing phases (C, D) ship
  as separate PRs and never mix with A/B (skill rule).
- Generated files only via their sync scripts; docs updated in the same change
  as the behavior they describe.
- Tests that grep `glass.css` structure (`glass-a11y-fallbacks`,
  `glass-performance`, `glass-optical-unity`, `glass-rim`) are characterization
  tests: when a phase changes structure, the step must update the test in the
  same diff **and state what behavior stayed fixed**.

## Pre-flight (before Step A1)

1. Baseline gate: `bun run lint && bun run typecheck && bun run test` — record
   green as known-good. If red, stop and fix first.
2. New branch off `main`: `refactor/glass-standards-refresh-2026-07`
   (current work sits on `refactor/context-layer-runtime-doctrine` — do not
   stack on it).
3. Characterization coverage already exists (a11y-fallbacks, contrast,
   performance, rim, backdrop-root-trap, border-consumption). Phase D adds its
   own before changing visuals.

---

## Phase A — Refactor: single-point fallback overrides (G1)

Collapse the six repeated 6-selector fallback lists into custom-property
indirection so a future 7th glass utility inherits every fallback for free.

### Step A1: Teach glass utilities to read override vars

- **File(s):** `packages/ui/src/styles/glass.css:56-233` (six `@utility` blocks)
- **Action:** Expand — introduce `--glass-backdrop-resolved`,
  `--glass-bg-resolved`, `--glass-border-resolved`, `--glass-shadow-resolved`
  consumed as `backdrop-filter: var(--glass-backdrop-resolved, blur(var(--glass-blur)) …)`
  etc. in all six utilities (mirror the existing `--glass-bevel-ring-display`
  pattern). Defaults keep today's computed values byte-identical; no fallback
  block touched yet.
- **Verification:** `bun --filter @pumni/ui test` && `bun --filter web test`
  (a11y-fallbacks + rim + performance still green against unchanged blocks)
- **Rollback:** `git checkout -- packages/ui/src/styles/glass.css`
- **Depends on:** none

### Step A2: Contract the fallback blocks onto the vars

- **File(s):** `packages/ui/src/styles/glass.css:244-376`;
  `packages/ui/src/test/glass-a11y-fallbacks.test.ts`
- **Action:** Rewrite `prefers-reduced-transparency`, `@supports not`, and the
  two `.glass-a11y-preview` blocks to set the `--glass-*-resolved` vars once at
  the media/selector scope instead of per-utility rules; delete the repeated
  selector lists. **Keep `forced-colors` explicit** (system colors replace
  properties wholesale; var indirection adds nothing there). Keep
  `prefers-contrast: more` overriding tint tokens as today (it changes tint
  density, not the filter). Update the characterization test to resolve the var
  indirection and assert the same *effective* declarations per utility × mode.
- **Verification:** `bun --filter @pumni/ui test` && `bun --filter web test`;
  then `bunx turbo run build --filter=catalog` (built CSS compiles; stories render)
- **Rollback:** revert this step's diff only (A1 defaults keep prod behavior)
- **Depends on:** A1

## Phase B — Refactor: retire dead alias vocabulary (G2)

### Step B1: Consumer audit (expand gate)

- **File(s):** repo-wide read-only
- **Action:** Grep `--glass-tint\b` (bare alias), `bg-glass\b`, `text-glass\b`,
  `border-glass`, `--color-glass` across `apps/*`, `packages/*`,
  `apps/catalog/src`. Known hits today: definition `theme.css:170`, mapping
  `theme.css:333-334`, a11y override blocks in `glass.css`, prose in skill/docs.
  If any *production class* consumer surfaces, stop and re-scope B2.
- **Verification:** audit table pasted into the step report
- **Rollback:** n/a (read-only)
- **Depends on:** A2 (blocks it edits are reshaped there)

### Step B2: Contract — delete alias + dead mappings

- **File(s):** `packages/ui/src/styles/theme.css:170,333-334`;
  `packages/ui/src/styles/glass.css` (a11y blocks that re-alias
  `--glass-tint`); `packages/ui/src/styles/personalization.css:118,130`;
  `.agents/skills/ui-styling/SKILL.md` + `REFERENCE.md` prose;
  `docs/conventions/design-system.md` if it names the alias
- **Action:** Remove `--glass-tint` and `--color-glass`/`--color-glass-border`;
  point any straggler at `--glass-tint-readable` / `--glass-edge` explicitly.
  Update docs/skill in the same diff (same-change rule).
- **Verification:** `bun run lint && bun run typecheck && bun run test` &&
  `bun run ai:check` (token-boundary + docs checks)
- **Rollback:** revert step diff
- **Depends on:** B1

## Phase C — Hardening: bound the media-floating worst case (G3)

Behavior-changing (visual): separate PR, never mixed with A/B.

### Step C1: Inventory media-floating glass

- **File(s):** `apps/web/src/features/watch/components/*` (known:
  `room-controls.tsx:461`, `watch-room.tsx:327,341`,
  `tap-to-play-overlay.tsx`), plus grep for `GlassSurface`/`glass-` under any
  component that overlays `<video>`/media containers
- **Action:** Read-only audit: for each surface record variant, what sits under
  it (video? layout gap? blob), and whether text/controls ride directly on
  glass. Output = table in step report deciding which surfaces are truly
  "glass over arbitrary media".
- **Verification:** table complete; user reviews scope before C2
- **Rollback:** n/a
- **Depends on:** none (parallel-safe with Phase A/B)

### Step C2: Encode the HIG dim rule as token + gate

- **File(s):** `packages/ui/src/styles/theme.css` (new
  `--glass-media-dim` token — e.g. `oklch(0 0 0 / 0.35)` per HIG "35% dim over
  bright content"); `packages/ui/src/styles/glass.css` (extend the *existing*
  scrim/panel vocabulary — prefer composing `overlay-scrim` under the surface
  rather than a new tier; final shape decided by the C1 table + a visual
  spike); `packages/ui/src/test/glass-contrast.test.ts` (new gate: for
  media-floating tiers, composite over synthetic near-white `oklch(0.97 0 0)`
  and near-black frames **through the dim layer** and require Lc ≥ 60)
- **Action:** Implement the chosen dim mechanism; wire the watch surfaces from
  C1 to it; add the gate so the worst case is bounded *by construction* instead
  of excluded as "invalid context".
- **Verification:** `bun --filter @pumni/ui test` (new gate green) &&
  `bun --filter web test`; manual screenshot of watch room over a white video
  frame attached to the report
- **Rollback:** revert step diff; gate additions revert with it
- **Depends on:** C1

### Step C3: Doctrine update — media branch in the decision tree

- **File(s):** `docs/conventions/design-system.md` (decision tree + hard
  rules); `.agents/skills/ui-styling/SKILL.md` checklist
- **Action:** Add the "floating over arbitrary media → dim layer mandatory
  (HIG clear-variant rule)" branch; document the new gate. Same-change rule:
  lands in the C2 PR.
- **Verification:** `bun run ai:check`
- **Depends on:** C2

## Phase D — Enhancement: scroll-edge separation (G4)

Behavior-changing (visual): separate PR.

### Step D1: Add `glass-scroll-edge-b` utility (spike → implement)

- **File(s):** `packages/ui/src/styles/glass.css` (new utility);
  `packages/ui/src/styles/theme.css` (edge-fade gradient stops if tokenized)
- **Action:** A cheap gradient/mask edge under sticky glass bars that separates
  scrolled content (research §5.3.4 web equivalent) — **must not** add a second
  `backdrop-filter` layer (stack cap). Preferred: `::after` gradient whose
  opacity is driven by a scroll-driven animation (`animation-timeline: scroll()`
  — vocabulary already exists in `scroll.css`) with a static-visible fallback
  where scroll-driven animations are unsupported; `prefers-reduced-motion`
  keeps the static form. 30-minute visual spike decides scroll-driven vs
  always-on before committing.
- **Verification:** `bun --filter @pumni/ui test` (extend
  `glass-performance.test.ts`: new utility contains no `backdrop-filter`, no
  raw `will-change`); catalog story renders
- **Rollback:** revert step diff
- **Depends on:** none (parallel-safe with A/B/C)

### Step D2: Consume in shell + document

- **File(s):** `apps/web/src/shared/components/app-shell/app-topbar.tsx:12`
  (sticky topbar); sidebar only if the D1 spike shows value;
  `docs/conventions/design-system.md`; catalog story
- **Action:** Apply the utility to the sticky topbar; add the doctrine line
  ("sticky glass bars carry scroll-edge separation"); story shows scrolled vs
  top-of-page states.
- **Verification:** `bun run lint && bun run typecheck && bun run test`;
  manual scroll screenshot pair in the report
- **Depends on:** D1

## Phase E — Bugfix: un-clip the bevel ring (G5)

Restores documented behavior (`fix` type). Visual change: the designed
gradient ring becomes visible for the first time — screenshot review is a
hard stop before merge.

### Step E1: Characterize, then move the ring inside the clip

- **File(s):** `packages/ui/src/styles/glass.css:80-101,121-140` (both
  `::before` rings); `packages/ui/src/test/glass-rim.test.ts` (extend)
- **Action:** Change ring geometry from `inset: -1px` (border band — clipped)
  to `inset: 0` (1px band just inside the padding edge — survives
  `overflow: hidden`). Keep `padding: 1px` + `mask-composite: exclude`
  unchanged. Extend `glass-rim.test.ts` to pin `inset: 0` on the ring with a
  comment citing the padding-box clip rule (CSS Overflow 3) and the 2026-07-11
  pixel verification, so `inset: -1px` cannot regress.
- **Verification:** `bun --filter @pumni/ui test` && `bun --filter web test`;
  re-run the scratchpad Playwright pixel probe (prod must now equal the
  overflow-visible control); before/after screenshots of dialog + dock +
  window in both themes attached to the report
- **Rollback:** revert step diff (one-line geometry + test)
- **Depends on:** none (parallel-safe; if Phase A lands first, coordinates on
  the same lines — rebase order A → E declared here)

### Step E2: Recalibrate ring alphas if the revealed ring overpowers

- **File(s):** `packages/ui/src/styles/theme.css:189-190`
  (`--glass-edge-top/bottom` alphas only)
- **Action:** The ring was tuned while (mostly) invisible; once revealed,
  0.65/0.14 light · 0.35/0.15 dark may read too hard against the inset bezel
  pair. Adjust alpha only (L/C/H stay), or no-op if screenshots read well.
  Rim stays APCA-ungated (specular doctrine, `REFERENCE.md:184`).
- **Verification:** `bun --filter @pumni/ui test` (rim direction guard:
  dark > light alpha must hold); screenshot pair in report
- **Rollback:** revert token diff
- **Depends on:** E1

## Phase F — Optional refactor: stylesheet cohesion (G6)

Zero visual change; pure file reorganization. Do last — lowest value, touches
the most test paths.

### Step F1: Split non-glass vocabulary out of `glass.css`

- **File(s):** `packages/ui/src/styles/glass.css` (§3 Interactive state layers
  + §4 Geometry/effects → move out); new
  `packages/ui/src/styles/effects.css` (focus-ring, `state-*`, skeleton,
  card-spotlight + `@property --spot-x/y`, rounded-nested,
  text-gradient-brand, animate-shimmer); `overlay-scrim` **stays** in
  glass.css (it is backdrop-filter vocabulary); `apps/web/src/app/globals.css`
  (add import); `docs/conventions/design-system.md` token-inventory list;
  tests that path-grep glass.css (`border-consumption.test.ts` CardSpotlight
  block, `glass-performance.test.ts`, `tailwind-source.test.ts`)
- **Action:** Mechanical move, no declaration edited; update test file paths
  in the same diff.
- **Verification:** `bun run lint && bun run typecheck && bun run test` &&
  `bunx turbo run build --filter=catalog` (built CSS byte-diff limited to
  rule order)
- **Rollback:** revert step diff
- **Depends on:** A2, B2, E1 (edits the same file; land the behavior-adjacent
  phases first so this stays a pure move)

---

## Testing strategy

- Phases A/B are pinned by existing characterization suites (a11y-fallbacks,
  contrast, rim, performance, border-consumption, backdrop-root-trap); the only
  test edits allowed are structural (resolve var indirection), asserting the
  same effective behavior.
- Phase C adds a new APCA gate (media worst-case through dim) — red first
  against today's unbounded composite, green after C2 wiring.
- Phase D extends the perf static audit; visual verification is manual
  (screenshot pair) because Playwright E2E needs a running app + Supabase —
  optional follow-up, not a gate.
- Full ladder (`bun run ai:premerge`) only at each phase's end, not per step.

## Definition of Done (per phase = per PR)

1. Phase's narrowest gates green; `bun run ai:premerge` green at phase close.
2. No file outside the phase's declared scope touched.
3. Owning docs/skills updated in the same PR where behavior/doctrine changed
   (B2, C3, D2).
4. Step reports in review-gate format with rollback paths; self-review against
   `review-gate` before reporting done.

## Risks & edge cases

| Risk | Severity | Mitigation |
|---|---|---|
| Var indirection interacts badly with Tailwind v4 `@utility` compilation (custom props fine in declarations, but verify built output) | Med | A1 ships with defaults byte-equivalent; A2 verified against built catalog CSS before deleting old blocks |
| `glass-a11y-fallbacks.test.ts` greps raw CSS text and goes stale mid-refactor | Med | Update test in the same diff as A2; assert effective declarations, not selector shape |
| Hidden `--glass-tint` consumer outside grep reach (string-built class names) | Low | B1 audit includes catalog + stories; expand–contract means B2 is a trivial revert |
| C2 dim layer visibly changes watch-room look; user may dislike 35% | Med | C1 inventory + screenshot review is a hard stop before C2; dim value is a token (one knob) |
| Scroll-driven `animation-timeline` support gaps | Low | Static-visible fallback is the base state; scroll-driven is progressive enhancement |
| Media gate (C2) fails for dark mode near-black frames (reverse polarity floor) | Med | Gate tests both polarities with signed Lc; dim token may need `light-dark()` split |
| E1 reveals a ring users have never seen — perceived as a redesign | Med | Screenshot review hard stop; E2 alpha knob ready; framing: bugfix restoring the documented 6-element model (element 5 currently missing) |
| F1 rule-order shift changes cascade outcomes | Low | Utilities are `@utility` (layer-managed by Tailwind v4); verify built CSS diff is order-only before merge |

## Not yet specified (fog of war)

- **C2 mechanism**: dedicated `glass-media` tier vs mandatory `overlay-scrim`
  composition — decided by the C1 inventory + visual spike; do not pre-commit.
- **P3 wide-gamut boost** for desktop blobs/accents via
  `@media (color-gamut: p3)` (research §3.2): deferred — decorative-only boost
  is safe (text gates stay sRGB), but needs a design pass on whether blobs
  deserve it; revisit after Phase C. If adopted, `stylelint-gamut`-style
  checking would ride the existing custom checkers, not new tooling (ADR-0025
  alternative-2 stance).
- **Lc 75 body-floor audit** on solid insets: research §4.2 sets body floor 75;
  Step-11 text-role tests may already pin this — verify during C1; graduate to
  a step only if a real gap shows.

## Decision Log

| Date | Decision | Rationale |
|---|---|---|
| 2026-07-11 | Targeted refresh, not rewrite | Audit table above: 8/12 research requirements already shipped and gated; rewrite destroys verified work |
| 2026-07-11 | Keep `color-mix(in oklch, …)` | Premultiplied alpha per CSS Color 5; resolver grammar cost > invisible benefit on near-neutral fills |
| 2026-07-11 | Lensing stays rejected | ADR-0021 is the owner; a plan cannot reopen an ADR |
| 2026-07-11 | Card stays one component; no solid/interactive split | Solid-vs-glass split already componentized (`Card` vs `GlassSurface`, pinned by `glass-optical-unity`); orthogonal cva axes over one opaque base are the settled industry shape; a split churns all call-sites for zero new enforcement |
| 2026-07-11 | Bevel-ring clipping treated as a bug (Phase E), not a redesign | Pixel-verified via Playwright: `inset: -1px` ring dies at the padding-box overflow clip; doctrine (`REFERENCE.md:180`) already promises the ring — the fix restores prose-vs-pixels agreement |
| 2026-07-11 | Border doctrine itself passes the audit | Three-concept model (structural hairline / specular rim / status tint), closed once-defined token set, WCAG 1.4.11 duty on `--input`, forced-colors path — all enforced by `border-consumption.test.ts`; no doctrine change needed, only the G5 rendering bug |
