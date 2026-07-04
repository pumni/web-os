# Design System Modernization — Full Execution Plan (2026-07-04)

- **Status:** done
- **Owner:** design system (`packages/ui` + `apps/catalog` + docs/skills)
- **Origin:** 2026-07-04 deep design-system review. Verdict: the system is architecturally sound (3-tier OKLCH tokens, APCA gate, closed surface vocabulary, ESLint guards, DTCG export, catalog + VRT). This plan closes the real gaps found — light/dark structural duplication, content density, static display type, thin catalog/VRT coverage, tier-1-only DTCG export — plus the owner-approved Tier-3 items (chart palette, `@property`, container-query density). Owner decisions on scope: **all tiers**, **full CSS modernization (`light-dark()` + relative color)**, **per-component VRT via catalog**.
- **Scope:** token pipeline unification + modern CSS syntax migration; content-density tokens; fluid display type; catalog story coverage + per-component VRT; DTCG export v2; chart palette tokens; `@property`; container-query density. Doc/skill sync at every behavioral change.
- **Non-goals:** no redesign (Phases 1–4 must be pixel-identical); no 4th token tier; no Style Dictionary/Terrazzo; no shadcn upstream rewrite; no APCA threshold/floor changes; no chart *library*; items still owned by `design-system-audit-continuation-2026-07.md` Phases 2+ (Badge `info`, reduced-motion re-home) stay there.
- **Execution rules:** one phase = one commit (Phase 7 may split into one commit per story group; each commit green). Surgical deltas only. Every phase ends green on its listed gate before the next starts. Gates follow the altitude table in `docs/ai/agent-command-policy.md` (§Validation Gates). When a phase changes documented behavior, update the owning doc/skill *in the same commit*.

---

## Phase 0 — Land in-flight component-token work + doc sync

**Problem.** The working tree holds the tail of the continuation plan's Phase 1 (dark component tokens moved from `theme.css` into a new `.dark` block in `component-tokens.css`; `token-css.ts` dark branch now layers `css.component`). All 197 `@pumni/ui` tests pass with it. But: (a) the owner docs drifted — `docs/conventions/design-system.md` §"Token source of truth" lists only `tokens/brand/theme/glass.css`, and neither it nor `.agents/skills/ui-styling/SKILL.md` names `component-tokens.css` as the tier-3 file; (b) the executed layout **deviates** from the continuation plan's 1b (which said dark overrides go to `theme.css`) — the deviation is better (tier cohesion) and must be recorded; (c) `buildTokenMap('light')` (`packages/ui/scripts/lib/token-css.ts:55-66`) layers `tokens → brand → theme` for `:root` but not `css.component`, while the dark branch does include it — an asymmetry.

### 0a. Fix `buildTokenMap` light-mode layering

Add `css.component` to the `:root` loop in `buildTokenMap` so light and dark resolve the same file set. Re-run `bun --filter @pumni/ui export-dtcg`; commit `tokens.dtcg.json` only if it changed (it should not — the export only emits `tokens.css :root` names).

### 0b. Commit the in-flight diff

`packages/ui/scripts/lib/token-css.ts`, `packages/ui/src/styles/component-tokens.css`, `packages/ui/src/styles/theme.css`. Note the 1b deviation in the commit message and mark the continuation plan's Phase 1 done-with-deviation.

### 0c. Sync owner docs

- `docs/conventions/design-system.md`: add `component-tokens.css` to §"Token source of truth"; amend tier-3 description ("Component — narrow, scoped vars… lives in `component-tokens.css`").
- `.agents/skills/ui-styling/SKILL.md`: tier rule line gains the file name (`primitive (tokens.css) -> semantic (theme.css) -> component (component-tokens.css)`).

**Gate.** `bun --filter @pumni/ui test` + `bun run ai:check`.

---

## Phase 1 — Unify the token resolver

**Problem.** Three parallel token parsers exist: `packages/ui/scripts/lib/token-css.ts` (resolves only `var()` chains to literal `oklch()`; throws on `color-mix`), `packages/ui/src/test/glass-contrast.test.ts:35-79` + `:239-290` (the richest: layered `buildTokenMap`, `resolveColor` following `var()` chains, `transparent`, and evaluating `color-mix(in oklch, …)` via `splitTopLevelCommas` + `mixOklch`, plus `buildAccentTokenMap` at `:168-190` for `personalization.css` layering), and `packages/ui/src/test/token-test-utils.ts` (single-file regex readers). Teaching new CSS syntax means teaching it three times.

### 1a. Extract the shared resolver

Create `packages/ui/scripts/lib/token-resolver.ts` (location may shift to `src/lib/` if vitest import ergonomics demand; keep it out of the component export surface either way). Move the glass-contrast implementation (the richest) into it: `readVariables`, `buildTokenMap` (mode + accent layering), `resolveColor`/`resolveColorValue`, `splitTopLevelCommas`, `mixOklch`. Preserve behavior exactly.

### 1b. Consume it everywhere

- `glass-contrast.test.ts` imports the module; its local copies are deleted. Every existing assertion passes **unchanged**.
- `export-dtcg.ts` / `token-css.ts` keep their scalar-only classification but delegate variable reading/resolution to the shared module.
- `token-test-utils.ts`: keep its narrow literal readers (they serve a different purpose — pinning raw source values), but re-export the resolver for tests that need resolution.

**Watch out.** `lib/oklch.ts` `oklchToSrgb` is deliberately linear-light (calibrated with `apca.ts` — see its header warning); do not "fix" gamma. Accent layering order (`[data-accent]` → `.dark[data-accent]` → generic `[data-accent]` derivation block) must keep its specificity-equivalent order.

**Gate.** `bun --filter @pumni/ui lint` + `typecheck` + `test` — zero expectation edits; `tokens.dtcg.json` byte-identical.

---

## Phase 2 — Teach the resolver `light-dark()` + relative color; write the ADR

**Problem.** `light-dark(a, b)` passes through `resolveValue` verbatim and throws in `resolveOklch` (`token-css.ts:94-100`); `oklch(from var(--x) …)` enters `parseOklch` and fails `OKLCH_PATTERN` (`packages/ui/src/lib/oklch.ts:47-50`). The Phase 3–4 migration is impossible until the pipeline understands both.

### 2a. Resolver support

In the shared resolver (not in `oklch.ts` — the literal-only parser and the `oklch(`-emission lint boundary stay intact):

- `light-dark(A, B)` → select branch by the map's mode before further resolution.
- `oklch(from <color> L C H [/ A])` → resolve `<color>` recursively, then evaluate channels with a **minimal documented grammar**: channel = literal number | `l`/`c`/`h`/`alpha` identifier | `calc(<ident> <+|-|*> <number>)`. Anything outside the grammar throws with a clear message (same "skip deliberately" discipline the DTCG export uses for composites).

### 2b. Resolver unit tests

New `packages/ui/src/test/token-resolver.test.ts`: branch selection per mode, relative-color channel math, nested `var()` inside both forms, error cases.

### 2c. ADR

New ADR (next number per `docs/adr/README.md`): "CSS-native color pipeline modernization" — records `light-dark()` adoption, the relative-color grammar, the single-resolver decision, and that the sRGB APCA gate remains the authority. Run `bun run ai:adr:sync`.

**Gate.** `bun --filter @pumni/ui lint` + `typecheck` + `test` + `bun run ai:check`.

---

## Phase 3 — Migrate token files to `light-dark()`

**Problem.** Every color token is written twice (`:root` + `.dark`) across `theme.css`, `brand.css`, `component-tokens.css`, and twice per accent in `personalization.css`. The forgotten-dark-block class of bug (exactly what Phase 0 lands the fix for) is structural. `color-scheme` is already correct in both modes (`tokens.css:16` light, `:374` dark), so `light-dark()` is safe to adopt.

### 3a. Mechanical merge — pure color tokens only

For each color custom property with a light+dark pair, collapse to one `:root` definition `--x: light-dark(<light>, <dark>);` in: `theme.css`, `brand.css` (keep the `@media (color-gamut: p3)` block structure; its two selectors can also merge), `component-tokens.css`, and the accent pairs in `personalization.css` (`[data-accent='x']` + `.dark[data-accent='x']` → one block). **Resolved values must be identical** — this is representation-only.

Non-color dark overrides stay in `.dark`: `--glass-blur` (blur), typography compensation (`--font-weight-body` etc.), multi-layer shadow composites (`--shadow-segmented-active`, `--shadow-slider-thumb`, shell-depth shadows). Colors *inside* a shadow may use inline `light-dark()` only where it reads cleanly; do not force it.

### 3b. Update drift guards + docs

- `border-consumption.test.ts` pins the three hairline tokens "defined exactly once per theme" — update to "defined exactly once, carrying both themes via light-dark()".
- `design-system.md` + `SKILL.md`: new-token authoring rule — color tokens default to `light-dark()`; `.dark` is reserved for non-color overrides.

**Watch out.** VRT must be pixel-identical (no re-baseline). `@theme inline` (`theme.css:304+`) is untouched. The `.dark` blocks shrink but do not disappear.

**Gate.** `bun --filter @pumni/ui lint` + `typecheck` + `test`; from `apps/web`: `bunx playwright test` (baselines unchanged); `bun run build`.

---

## Phase 4 — Relative color for accent derivation in `personalization.css`

**Problem.** Each accent (`personalization.css:26-122`) is a ~10-line hand table × 2 themes deriving ring/gradient/chart from adjacent primitive stops. Most derivations are systematic ("ring = one lightness stop above primary") and can be expressed once.

### 4a. Derive where lossless, keep literal where hand-tuned

Per accent, define the base stop(s); derive `--ring` / `--brand-gradient-*` / `--chart` with `oklch(from …)` **only where the derived value equals the current hand stop (or is imperceptibly close, with VRT as referee)**. Documented hand-tuned exceptions stay literal with their comments — e.g. rose dark keeps `--red-600` for the APCA gate (`personalization.css:112-117`). Goal is duplication reduction, not purity: if derivation can't match, keep the table for that token.

### 4b. Verify the gates

The "Accent personalization" suite (glass-contrast, `ACCENTS` × light/dark from `:292`) is the hard gate; VRT accent snapshots (violet, rose in `design-system-visual.spec.ts`) must not change — any intentional re-baseline is called out in the commit message.

**Gate.** `bun --filter @pumni/ui lint` + `typecheck` + `test`; `bunx playwright test`.

---

## Phase 5 — Content density (density tier 2)

**Problem.** `data-density='compact'` only changes `--control-height`/`--control-py`/`--switch-*` (`tokens.css:342-363`). Content surfaces hard-code the 6-scale: `card.tsx:41` (`gap-6 py-6`), `card.tsx:144/193/204` (`px-6`), `dialog.tsx:64`, `alert-dialog.tsx:89`, `banner.tsx:84` (`p-5 md:p-6`), `card-well.tsx:37` (`lg: 'p-6'`), `bento-grid.tsx:305`. Compact density visibly does nothing to content. Also the Switch dimension tokens are split across two files: comfortable defaults in `component-tokens.css:3-5`, compact overrides in `tokens.css:357-363`.

### 5a. Add surface spacing component tokens

In `component-tokens.css`: `--surface-padding` (comfortable `1.5rem` = today's `p-6`), `--surface-gap` (`1.5rem`), with `[data-density='compact']` overrides (`1.25rem` / `1rem` — tune against the preview). Bridge via `@theme inline` only if a named utility is needed; otherwise consume with Tailwind v4 arbitrary-value form.

### 5b. Migrate consumers

Replace the hard-coded classes at the anchors above with `p-(--surface-padding)` / `gap-(--surface-gap)` / axis variants. Comfortable resolves to the same pixels → **default rendering unchanged**.

### 5c. Reunify Switch density tokens

Move the `--switch-height/-width/-thumb-size` comfortable+compact pairs wholly into `component-tokens.css` (compact under its `[data-density='compact']` selector there); delete the fragment from `tokens.css`.

### 5d. Compact VRT snapshot + docs

Add one showcase snapshot with compact density to `design-system-visual.spec.ts` (mirror the `pumni-accent`/`pumni-glass` localStorage pattern; confirm the density key in `PersonalizationProvider` first). Update REFERENCE.md §Personalization and design-system.md if a utility was added.

**Gate.** `bun --filter @pumni/ui lint` + `typecheck` + `test`; `bunx playwright test` (existing baselines unchanged; new compact baseline generated).

---

## Phase 6 — Fluid display typography

**Problem.** The type scale (`tokens.css:132-148`) is static and tops out at `--font-size-4xl: 2.25rem`. Display/hero text can't breathe on large screens without hand-rolled breakpoints. UI text must stay static (fluid body text is an anti-pattern for dense OS chrome).

### 6a. Fluid primitives for the display tier only

In `tokens.css`: `--font-size-display: clamp(2.25rem, <preferred with vi>, 3.5rem)` — **min equals today's 4xl**, so at current VRT viewports nothing changes. Optionally `--font-size-hero` (larger clamp) with a matching line-height token.

### 6b. Wire the roles

`theme.css`: `type-display` (`:438`) reads the new fluid token; add `type-hero` utility if 6a added the hero stop. `--text-xs…4xl` and all other type roles untouched.

### 6c. Verify pinned tests

`apps/web/src/test/design-system/dark-typography.test.ts` and `doc-token-drift.test.ts` may pin type-token names — run the full repo test suite. DTCG export will skip `clamp()` (non-scalar) by design; the skip count rises.

**Gate.** `bun run lint && bun run typecheck && bun run test` (repo-wide); `bunx playwright test` (baselines unchanged — clamp min = current value).

---

## Phase 7 — Catalog story coverage

**Problem.** 8 stories cover ~40+ components; form controls (which just gained dedicated component tokens), overlays, and feedback have none. Stories are also the substrate for Phase 8's per-component VRT.

### 7a–7d. Add CSF3 stories, one commit per group

Follow the existing convention exactly (`apps/catalog/src/stories/button.stories.tsx`: `Meta`/`StoryObj` from `@storybook/react-vite`, title `'Group / Name'`, import from the `@pumni/ui/<role>` barrel, `render` mapping over a local variants array):

1. **form**: input, textarea, select, checkbox, radio-group, switch, slider, segmented-picker, submit-button, form (+ label/auth-field folded in).
2. **overlay**: popover, dropdown-menu, context-menu, sheet, tooltip, alert-dialog, command-palette — rendered **open by default** so VRT can capture them.
3. **feedback**: banner, skeleton, progress, chat-bubble, kbd-chip, ping-dot, sonner.
4. **layout/os**: accordion, tabs, avatar, scroll-area, separator, section-heading, card-well, icon-badge, highlight, bento-grid, dock.

Stories must be *capturable static states*: enumerate variants × meaningful states (e.g. Card `state`, `aria-invalid` inputs) as separate static renders; no stories that depend on pointer position.

### 7e. Add `@storybook/addon-a11y`

Dev-time only, wired in `.storybook/main.ts`.

**Gate.** `bun run catalog:lint && bun run catalog:typecheck && bun run catalog:build` after each commit.

---

## Phase 8 — Per-component VRT via catalog

**Problem.** VRT today is 4 whole-page screenshots of `/design-system-preview` (`apps/web/e2e/design-system-visual.spec.ts`) — coarse diffs, and components absent from the showcase are unguarded.

### 8a. Playwright against the static Storybook build

New `apps/catalog/playwright.config.ts` + `apps/catalog/e2e/stories-visual.spec.ts`:

- `webServer`: `bun run catalog:build` then serve `storybook-static` on a dedicated port (e.g. 61001; pick the lightest Bun-invocable static server — decide at implementation).
- Spec reads `storybook-static/index.json`, iterates story IDs, navigates `iframe.html?id=<id>&viewMode=story`, snapshots at light and dark (check `.storybook/preview.tsx` for how theme is wired — `.dark` class toggle vs decorator — and drive it the same way).
- `reducedMotion: 'reduce'`, `animations: 'disabled'`, `maxDiffPixelRatio: 0.02` (match `apps/web/playwright.config.ts`).

### 8b. Wiring + baselines

- `catalog:vrt` script in `apps/catalog/package.json` (`bunx playwright test`); `@playwright/test` dev-dep from the catalog.
- Baselines are platform-suffixed; per existing repo practice the local `-win32` baselines are committed (same caveat header as `design-system-visual.spec.ts`).
- Keep the apps/web showcase VRT as integration smoke, unchanged.

### 8c. Docs

Record the two-level VRT strategy + re-baseline procedure in `design-system.md` (or REFERENCE.md §visual-regression).

**Watch out.** Infinite animations (spinner, ping-dot, skeleton) must freeze under `reducedMotion: 'reduce'`. If any component doesn't, that is a real reduced-motion bug — fix the component, don't mask the test.

**Gate.** `bun run catalog:vrt` green twice consecutively (flake check) + `catalog:build`.

---

## Phase 9 — DTCG export v2

**Problem.** `export-dtcg.ts` exports only `tokens.css :root` scalars, fully resolved (aliases lost), skipping composites and dark mode — unusable for Figma Variables or a second consumer platform.

### 9a. Multi-tier, alias-preserving export

Rework `buildDtcg` on top of the Phase-1 resolver:

- Emit hierarchical groups `primitive.*` / `semantic.*` / `component.*`.
- Preserve references as DTCG aliases (`"$value": "{primitive.color.coral-600}"`) instead of flattening.
- Add composite `$type`s: `shadow` (parse multi-layer box-shadows), `cubicBezier`, `fontWeight`/`fontFamily` (and `typography` for the `type-*` roles if it stays compact).
- Dark values via `$extensions` (e.g. `com.pumni.modes: { dark: <value|alias> }`) — DTCG has no native modes; Phase 3's `light-dark()` makes extraction mechanical (one source yields both modes).

### 9b. Regenerate + retest

Regenerate `tokens.dtcg.json`; `dtcg-export.test.ts` keeps its byte-match contract against the new output. Amend ADR-0021 with a v2 note; `bun run ai:adr:sync`.

**Gate.** `bun --filter @pumni/ui lint` + `typecheck` + `test` + `bun run ai:check`.

---

## Phase 10 — Tier 3 items

### 10a. Multi-series chart palette

`--chart` is a single token with zero real consumers (only a demo string and a test comment reference it). Add semantic `--chart-1…--chart-5` in `theme.css` via `light-dark()`: coral lead + indigo + cyan/teal + amber + violet, differentiated in **lightness** as well as hue (CVD safety). Gate each in glass-contrast over `--background`/`--card` both themes using the already-pinned accent-surface floor (Lc 45) — no new thresholds. `@theme inline` mapping (`--color-chart-N`). Personalization: only `--chart-1` follows the accent (the existing `--chart` mechanism); 2–5 stay fixed. Add a `DataViz / Chart palette` swatch story in the catalog (no chart library). Update REFERENCE.md's `chart` row and retire the "§D2 deferred" note.

### 10b. `@property` registration

Register `--spot-x`/`--spot-y` in `glass.css` (`syntax: '<length-percentage>'`, `inherits: false`, `initial-value: 50%`) so the spotlight position interpolates as a typed value; add a short `motion-safe` transition on the spot position. Progressive: non-supporting browsers keep today's behavior.

### 10c. Container-query density

Card/CardWell self-condense in narrow containers: establish a container on Card and add an `@container (width < 24rem)` rule lowering `--surface-padding` (the Phase-5 token). `CardHeader` already uses `@container/card-header` (`card.tsx:144`) — extend that pattern, scoped to Card/CardWell only.

**Watch out.** 10b/10c may change pixels in hover/narrow states — any VRT re-baseline must be deliberate and named in the commit message.

**Gate.** `bun --filter @pumni/ui lint` + `typecheck` + `test`; `bun run catalog:vrt`; `bunx playwright test`.

---

## Phase 11 — Closeout

1. `bun run ai:premerge` (ai:check + ai:eval + lint + typecheck + test + build) plus `bunx playwright test` (apps/web) and `bun run catalog:vrt`.
2. Final pass over the three owner docs (`design-system.md`, `SKILL.md`, `REFERENCE.md`) against the end state; `bun run ai:skills:sync` if skill files changed.
3. Set this plan's **Status: done** (record deviations); settled decisions → `docs/ai/MEMORY.md`.

---

## Final validation

- Every phase ends green on its listed gate before the next begins.
- Cross-phase invariants: `tokens.dtcg.json` unchanged through Phases 1–8 (changes only in Phase 9); VRT baselines unchanged except where a phase explicitly generates new ones (P5 compact, P8 catalog) or declares a re-baseline (P10); `@pumni/ui` test expectations edited only where declared (`border-consumption` in P3, dtcg-export in P9).
- Dependency order: P0 → P1 → P2 → P3 → P4; P5/P6 independent after P3 (new tokens authored in `light-dark()` form); P7 → P8; P9 after P3–P4 (alias structure settles first); P10 after P5 (10c needs the density token) and P8 (story/VRT substrate); P11 last.

## Deferred owner decisions

- Compact values for `--surface-padding`/`--surface-gap` (P5) — tune visually against the preview before committing.
- Whether `type-hero` ships in P6 or waits for a first hero consumer.
- Static-serve mechanism for `storybook-static` in P8 (pick the lightest Bun-invocable option available in the tree).

## Explicitly rejected

- A 4th token tier; external token build systems (Style Dictionary/Terrazzo) — hand-authored CSS + drift tests remain the source of truth.
- Rewriting components against shadcn upstream.
- Changing APCA thresholds or pinned floors; reintroducing a WCAG 2.x ratio gate.
- Adding a charting library while no data-viz feature consumes it (10a ships tokens + gate + swatch story only).
- Fluid body/UI text (fluid type is display-tier only).
