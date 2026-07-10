# Plan: Glass unification — one optical system, one usage flow

- **Status:** Shipped (2026-07-10)
- **Date:** 2026-07-10
- **Owner:** `@pumni/ui` + production glass consumers (`apps/web`)
- **Skills:** `grill-requirements` (spec) → hybrid execution plan (`refactor-plan` step template; **intentional visual/API behavior change**, not structure-only)
- **Branch (in progress):** `feat/glass-modern-standard-hardening` (continue here or rename to `feat/glass-unification` after confirm)
- **Supersedes for remaining work:**
  - `docs/plans/glass-modern-standard-hardening-2026-07.md` (a11y contrast-more **shipped**; residual stack/consumer/P1–P2 absorbed here)
  - Open leftovers of archived `glass-modernization-relative-apca-2026-07.md` (media dim, on-glass, grain)
- **Research basis:** CSS Color 4/5, APCA Bronze, MDN/web.dev `backdrop-filter`, Apple HIG Materials (clear/regular, no web refraction), Material 3 scrim/elevation; deep audit 2026-07-10 (patchwork recipes, Card glass quality)

---

## Outcome (one sentence)

Unify Pumni glass into **one engineered frosted material system** (single optical core, two tint tiers, one decision tree, clean public API) so every production and showcase surface looks and is used the same way — no dual lab recipes, no dialog-grade Card glass teaching, no nested titlebar BF — while preserving APCA gates, floating-only placement, and shell performance budget.

---

## Spec (grill-requirements)

### Problem statement (evidence)

| Symptom | Cause |
| --- | --- |
| Card glass looks “ugly” / dirty | `Card variant="glass"` = full `glass-panel` (mask bevel + face reflection + drop shadow) on multi-line content composition |
| Feels patchwork from many sources | **4 optical recipes** (panel mask, simple grain, bar edges, titlebar densify+BF) + **3 APIs** (`GlassSurface`, `Card glass/simple`, raw utilities) |
| Showcase contradicts production | Nested `GlassSurface titlebar` inside window demo; Window production uses **single** `glass-window` shell |
| Dual language pinned by tests | `glass-panel-simple` grain only; public `Card glassSimple` with ~zero app consumers |
| Token layer already unified | `--glass-fill` relative α, soft/strong, a11y densify chrome+readable — **keep**; fix **render + API + docs** |

### In scope

| ID | Workstream | Type |
| --- | --- | --- |
| **U1** | **Optical core unify** — one readable floating recipe (panel/window); drop or quarantine simple+grain; tame face reflection; consistent overflow/isolation | CSS visual |
| **U2** | **Chrome tier keep distinct geometry** (bars / edge-r/b / bordered) but same BF stack + tint SSOT — document as intentional role split, not second lab | CSS + docs |
| **U3** | **API cleanup** — `GlassSurface` = public custom glass entry; deprecate `Card glassSimple`; narrow or remove `Card glass`; deprecate public `titlebar` variant (match Window non-BF header) | API |
| **U4** | **Decision tree** in design-system + ui-styling skill (when solid / chrome / readable / solid-inset-in-glass) | Docs |
| **U5** | **Showcase + catalog + playground** rewrite to production truth (blob backdrop, short glass copy, single window shell) | Consumers demo |
| **U6** | **Production consumer pass** — overlays, OS window/dock, app topbar, watch `GlassSurface`, auth solid (verify); fix any raw dual recipes | Consumers app |
| **U7** | **Stack budget** — keep/extend tests: scrim+one shell; no nested glass BF utilities | Test |
| **U8** | **Gates** — a11y fallbacks, contrast soft/strong, performance, border-consumption, card tests updated | Test |
| **U9** | Optional later: media dim token + watch formalize; optical proxy; on-glass text | Feature (phased last) |

### Out of scope (hard fence)

| Do not | Why |
| --- | --- |
| Apple Liquid Glass refraction / lensing / chromatic aberration | GPU + text clarity |
| WCAG 2 ratio as primary glass gate | Dynamic backdrop; keep optional bridge only |
| APCA gate on specular edge tokens | Light rim, not control boundary |
| Blur ladder outside 12 / 16 / 20 / 24 or raise cap | Identity |
| Glass on forms / tables / long body | Solid `DialogBody` / `CardWell` / `Card solid` |
| Runtime Color.js / oklch.com in bundle | Authoring-only |
| Brand/accent palette redesign | Unrelated |
| Supabase / server / RLS | No data surface |
| Mint new ADR number | design-system SSOT; 0012 burned |
| Full design-trends lab rewrite beyond false-doctrine + API align | Scope |

### Explicit assumptions (defaults — confirm or override)

| # | Assumption | Default |
| --- | --- | --- |
| **A1** | **Remove public `Card glassSimple`** and CSS path `glass-panel-simple` from production utilities (or keep CSS only behind playground flag). Grain not production. | **Remove from Card + retire utility after test migration** |
| **A2** | **`Card variant="glass"` removed** from public Card API; short floating tiles use `GlassSurface variant="panel"`. Overlays keep package-internal `glass-panel` class. | **Remove Card glass** (breaking for any external consumer — monorepo-only today) |
| **A3** | **Face reflection** on `glass-panel` / `glass-window`: reduce to top-only highlight or remove full-face 135° gradient (keep inset bezel + edge ring + shadow). | **Remove full-face reflection `::after`**; keep inset bezel + mask edge |
| **A4** | **Edge technique for readable:** keep **mask bevel ring** for panel/window only (one technique). Bars stay solid/shell edges. | **Keep mask for panel/window** |
| **A5** | **`GlassSurface titlebar`:** remove variant; document Window pattern (header inside shell, no second BF). Delete or stop exporting `glass-titlebar` if unused after. | **Deprecate + remove from GlassSurface** |
| **A6** | Soft/strong α matrix unchanged unless contrast tests fail after optical change | **Keep α** |
| **A7** | Media dim + on-glass = Phase 5 optional after unity ships | **Defer unless watch needs token** |
| **A8** | Commit only on user request; one branch for whole program | **No auto-commit** |
| **A9** | Showcase must match production Window (no nested titlebar glass) | **Yes** |

### Acceptance criteria (falsifiable)

1. **Single readable optical recipe** in production CSS: `glass-panel` and `glass-window` share the same face/edge model (diff only shadow token / inactive state). No `glass-panel-simple` in production export path.
2. **Public React glass entry** for app authors is `GlassSurface` (panel | window | bar family) + package overlays; **no** `Card` glass variants.
3. **Decision tree** published in `docs/conventions/design-system.md` and skill checklist; agent can pick solid vs chrome vs readable without reading archive plans.
4. Design-system **Card glass demo removed or replaced** with `GlassSurface` short chrome over blobs; multi-line body only on solid.
5. Window showcase = **one** BF shell (no nested `glass-titlebar`).
6. Overlay quartet (Dialog/Sheet/AlertDialog/Command) still exactly 1 scrim + 1 panel; stack test green.
7. APCA: default + soft + strong, both modes, chrome + readable, Lc ≥ 60 still green.
8. A11y: reduced-transparency, prefers-contrast (chrome **and** readable), forced-colors, `@supports` green.
9. `rg` production apps: no `glassSimple`, no `variant="glass"` on Card, no nested titlebar glass in Window consumers.
10. `bun run --filter @pumni/ui test` glass suite + card tests green; `bun run ai:check` after docs/skill.

### Verification gates

| Scope | Command |
| --- | --- |
| Glass CSS / tokens / a11y | `bun run --filter @pumni/ui test glass-contrast glass-performance glass-a11y-fallbacks border-consumption` |
| Card API | `bun run --filter @pumni/ui test card` (or path matching `card.test`) |
| Full UI | `bun run --filter @pumni/ui test` + `typecheck` |
| Web design-system / glass tests | `bun run --filter @pumni/web test` (scoped design-system if available) |
| Context | `bun run ai:check` |
| Pre-merge | `bun run ai:premerge` or scoped premerge |

### Security

UI/CSS/docs only. No RLS, secrets, or server-only imports into client.

### Blast radius

| Area | Paths |
| --- | --- |
| Core | `packages/ui/src/styles/{glass,theme,personalization,tokens}.css` |
| Components | `packages/ui/src/components/{identity/glass-surface,layout/card,os/*,overlay/*,feedback/sonner,form/select}.tsx` |
| Tests | `packages/ui/src/test/glass-*.ts`, `border-consumption`, `card.test`; `apps/web/src/test/design-system/glass-*` |
| App | `apps/web/.../design-system/*`, design-trends, watch GlassSurface, layout topbar, catalog stories |
| Docs | `docs/conventions/design-system.md`, `.agents/skills/ui-styling/*`, plan pointers, MEMORY if needed |

---

## Target state

### Material model (canonical)

```text
OPTICAL CORE (readable floating: panel / window)
  1. Tint: --glass-tint-readable (from --glass-fill + α)
  2. BF: blur(--glass-blur) saturate brightness
  3. Edge: ONE technique — mask bevel ring (::before) from edge-top/bottom
  4. Depth: --shadow-glass | --shadow-glass-glow
  5. Inset light: --glass-inset-bezel-top (+ optional bottom shadow-edge)
  6. NO full-face diagonal reflection (or token-off by default)
  7. overflow: hidden; isolation as needed for children

CHROME CORE (bars)
  Tint: --glass-tint-chrome
  BF: same stack
  Edge: role geometry only (none | --glass-edge | shell-depth)
  NO mask bevel, NO face reflection, NO grain

SOLID CONTENT
  Card solid / inset / spotlight / DialogBody / CardWell
```

### API model (canonical)

| Need | Use |
| --- | --- |
| Custom floating chrome/panel in app | `GlassSurface` variant |
| Dialog / menu / popover / sheet / command / toast / select | Package components (internal `glass-panel`) |
| OS window | `Window` → `glass-window` only |
| Dock / topbar | `glass-bar-*` via Dock / layout / `GlassSurface` bar* |
| Content card | `Card` solid \| inset \| spotlight **only** |
| Dense content inside glass shell | `DialogBody` / `CardWell` |

### Decision tree (publish verbatim in design-system)

```text
Floating over content/media/blob?
  NO  → Card solid / page bg. STOP.
  YES → Multi-line body / form / table?
          YES → solid surface, OR glass shell + solid inset. STOP.
          NO  → Shell chrome (topbar, dock, rail, control strip)?
                  YES → chrome tier (GlassSurface bar*). STOP.
                  NO  → Overlay / window shell?
                          YES → readable (component or GlassSurface panel/window). STOP.
                          NO  → Hero short tile only with blob parent?
                                  YES → GlassSurface panel, short copy.
                                  NO  → solid Card.
```

---

## Context — baseline (2026-07-10)

### Pre-flight

```
branch: feat/glass-modern-standard-hardening
bun run --filter @pumni/ui test glass-contrast glass-performance glass-a11y-fallbacks border-consumption
→ 152 tests passed
```

**Known-good baseline:** 152 green. Do not start structural steps if this goes red for unrelated reasons — fix first.

### Already done (do not re-do)

- Relative `--glass-fill` + chrome/readable α scale  
- soft/strong personalization alpha-only + APCA gates  
- `prefers-contrast` densifies **both** chrome and readable (`glass-a11y-fallbacks`)  
- Auth shell: solid Card over desktop  
- Window production: single shell, no titlebar BF  

### Still broken / patchwork

| ID | Item | Evidence |
| --- | --- | --- |
| P1 | Dual recipe simple + grain | `glass.css` `@utility glass-panel-simple`; Card `glassSimple` |
| P2 | Card glass = dialog recipe + content layout | `card.tsx` + `cards-section.tsx` multi-line |
| P3 | Full-face reflection | `glass-panel` / `window` `::after` |
| P4 | Nested titlebar in showcase | `surfaces-section.tsx` GlassSurface titlebar inside window |
| P5 | `GlassSurface` still exports titlebar | `glass-surface.tsx` |
| P6 | Marketing dual tier same class | surfaces-section Card glass vs GlassSurface panel |
| P7 | grain policy tests lock dual language | `glass-performance.test.ts` |
| P8 | design-system still lists glass as Card variant composition | design-system.md card layer paragraph |

---

## Constraints & invariants

- Token tiers primitive → semantic → component; no raw OKLCH in components.  
- `light-dark()` colors; `.dark` non-color only.  
- BF stack ≤ 2; never animate `backdrop-filter`.  
- Lc 60 short UI on glass; body Lc 75+ solid only.  
- Floating-only + colourful backdrop requirement.  
- Surgical diffs; no drive-by package refactors.  
- P0 security unchanged.  

---

## Phases & steps

### Phase 0 — Pre-flight & characterization

#### Step 0.1: Confirm branch + baseline

- **File(s):** git  
- **Action:** Stay on `feat/glass-modern-standard-hardening` or rename to `feat/glass-unification` after user confirm. Re-run glass suite; record pass count.  
- **Verification:** 152+ green (or updated count)  
- **Rollback:** n/a  
- **Depends on:** user confirm plan  

#### Step 0.2: Inventory freeze (rg snapshot in plan appendix if drift)

- **Action:** Confirm no new `glassSimple` / Card glass consumers outside known list.  
- **Verification:**  
  `rg -n "glassSimple|variant=\"glass\"|glass-panel-simple|glass-titlebar" packages apps --glob "!**/archive/**"`  
- **Depends on:** 0.1  

#### Step 0.3: Characterization tests RED for target doctrine

- **File(s):** new or extend  
  - `packages/ui/src/test/glass-optical-unity.test.ts`  
  - update expectations that currently **require** grain-on-simple  
- **Action:**  
  1. Assert production `glass.css` has **no** `@utility glass-panel-simple` (or marked `@layer playground` only — prefer delete).  
  2. Assert `glass-panel` and `glass-window` do **not** set full-face `--glass-reflection` on `::after` (or reflection token is `none`).  
  3. Assert `cardVariants` has no `glass` / `glassSimple` keys.  
  4. Assert `glassSurfaceVariants` has no `titlebar`.  
- **Verification:** tests **RED** until later phases  
- **Rollback:** delete new asserts  
- **Depends on:** 0.2  

---

### Phase 1 — Optical core (CSS) — visual unity

#### Step 1.1: Remove full-face reflection from panel/window

- **File(s):** `packages/ui/src/styles/glass.css` (`glass-panel`, `glass-window` `::after` blocks); `theme.css` (`--glass-reflection` keep token optional or unused)  
- **Action:** Delete face `::after` reflection layers on panel/window. Keep inset bezel + mask `::before` + shadow.  
- **Verification:** visual sanity; `glass-performance` / border-consumption still green; update any test that required `::after` reflection  
- **Rollback:** restore `::after` blocks  
- **Depends on:** 0.3  

#### Step 1.2: Align panel/window geometry (overflow, isolation)

- **File(s):** `glass.css` panel + window  
- **Action:** Add `overflow: hidden` (and `isolation: isolate` if needed) so children and bevel mask clip cleanly; ensure children stack above bevel (`isolation` + children not under z-1 trap — bevel pointer-events none already).  
- **Verification:** dialog/popover open smoke; unit tests  
- **Depends on:** 1.1  

#### Step 1.3: Retire `glass-panel-simple` utility

- **File(s):** `glass.css`; a11y selector lists; `glass-performance`, `glass-panel-simple-tokenization` (web), backdrop-root-trap  
- **Action:** Remove `@utility glass-panel-simple` and all a11y list entries. Rewrite performance test: **no fractalNoise grain in glass.css production**. Delete or rewrite web tokenization test.  
- **Verification:** Step 0.3 optical unity asserts progress; glass suite green  
- **Rollback:** restore utility + tests  
- **Depends on:** 1.1  

#### Step 1.4: Retire or gut `glass-titlebar` utility

- **File(s):** `glass.css` `@utility glass-titlebar`; a11y lists  
- **Action:** Remove utility. Inactive window rules referencing `.glass-titlebar` → remove or retarget to `[data-slot=window-titlebar]` if needed (production Window already doesn't use class).  
- **Verification:** Window component tests / SSR; glass suite  
- **Depends on:** 1.3  

#### Step 1.5: Theme comment / dead token cleanup

- **File(s):** `theme.css` glass section comments; unused `--glass-reflection` / grain opacity if fully dead  
- **Action:** Either delete unused tokens or mark reserved; avoid DTCG ghosts. Prefer delete grain opacity if unused.  
- **Verification:** token-resolver / dtcg tests if present  
- **Depends on:** 1.3–1.4  

---

### Phase 2 — Public API cleanup

#### Step 2.1: Card — remove glass variants

- **File(s):** `packages/ui/src/components/layout/card.tsx`, `card.test.tsx`  
- **Action:** Remove `glass` and `glassSimple` from `cardVariants`. Update JSDoc: content surfaces solid/inset/spotlight only; floating glass → `GlassSurface`.  
- **Verification:** card tests green; typecheck  
- **Rollback:** restore variants  
- **Depends on:** 1.3  

#### Step 2.2: GlassSurface — remove titlebar variant

- **File(s):** `packages/ui/src/components/identity/glass-surface.tsx`  
- **Action:** Drop `titlebar` from cva; document Window header pattern in component JSDoc.  
- **Verification:** ssr-safety; typecheck  
- **Depends on:** 1.4  

#### Step 2.3: Export / barrel / catalog story audit

- **File(s):** identity index, catalog stories  
- **Action:** Stories cover panel + one bar variant over Backdrop; no titlebar story (or story shows Window).  
- **Verification:** catalog typecheck if in CI  
- **Depends on:** 2.1–2.2  

---

### Phase 3 — Showcase, playground, app consumers

#### Step 3.1: Rewrite design-system surfaces-section

- **File(s):** `apps/web/src/features/design-system/components/surfaces-section.tsx`  
- **Action:**  
  - Blob backdrop retained.  
  - Chrome: `GlassSurface bar` only.  
  - Readable: `GlassSurface panel` short labels only (no dual Card glass caption).  
  - Window: single `GlassSurface window` or document “use Window”; header = plain header row **without** second glass.  
  - Remove `Card variant="glass"`.  
- **Verification:** typecheck web; manual visual  
- **Depends on:** Phase 2  

#### Step 3.2: Rewrite cards-section glass demo

- **File(s):** `cards-section.tsx`  
- **Action:** Replace glass Card with solid vs solid comparison, **or** short `GlassSurface` tile + caption “not a Card variant”. Hierarchy copy updated.  
- **Verification:** typecheck  
- **Depends on:** 2.1  

#### Step 3.3: foundations-section elevation glass class

- **File(s):** `foundations-section.tsx`  
- **Action:** Keep `glass-panel` only as elevation demo over blobs; caption decision-tree aligned; no Card glass.  
- **Depends on:** Phase 1  

#### Step 3.4: design-trends / playground false doctrine

- **File(s):** `apps/web/src/features/design-trends/*`  
- **Action:** Remove teaching of dual simple grain as production; no navy rim / forbidden ladders; prefer GlassSurface.  
- **Depends on:** Phase 1–2  

#### Step 3.5: Production consumers spot-check (no API break)

- **File(s):** watch `room-controls` / `watch-room`, `(app)/layout` topbar, dock, overlays (no change if already correct)  
- **Action:** Confirm still compile after Card/GlassSurface API change; watch stays GlassSurface panel.  
- **Verification:** `bun run --filter @pumni/web typecheck`  
- **Depends on:** 2.2  

---

### Phase 4 — Docs & skill SSOT

#### Step 4.1: design-system.md

- **File(s):** `docs/conventions/design-system.md`  
- **Action:**  
  - Publish decision tree.  
  - Card variants: solid / inset / spotlight only.  
  - Glass API table: GlassSurface + internal utilities.  
  - Optical core 5–6 elements (no grain, no face reflection).  
  - Window pattern: single shell.  
  - Remove glassSimple / grain production language.  
  - Point superseded plans to **this** plan.  
- **Verification:** `bun run ai:check`  
- **Depends on:** Phase 1–3 code settled enough to match docs  

#### Step 4.2: ui-styling skill + REFERENCE

- **File(s):** `.agents/skills/ui-styling/SKILL.md`, `REFERENCE.md` if tables exist  
- **Action:** Same doctrine; checklist items for Card-no-glass, no simple, no nested titlebar BF.  
- **Verification:** `bun run ai:check` / skills sync if required  
- **Depends on:** 4.1  

#### Step 4.3: MEMORY + plan status banners

- **File(s):** `docs/ai/MEMORY.md` (if glass bullets exist); this plan status → Active/Shipped; hardening plan → “Superseded by glass-unification…”  
- **Depends on:** 4.1  

#### Step 4.4: glass.css header comment rewrite

- **File(s):** `glass.css` top banner  
- **Action:** One canonical  model description; no “Glassmorphism Studio” / dual lab provenance.  
- **Depends on:** Phase 1  

---

### Phase 5 — Optional hardening (after unity)

Only if still needed:

| Step | Item | Gate |
| --- | --- | --- |
| 5.1 | Optical proxy in glass-contrast (brightness/saturate approx) | glass-contrast |
| 5.2 | `--glass-media-dim` + document watch recipe (one consumer) | design-system + watch |
| 5.3 | Spike `--on-glass` if short labels fail margin | glass-contrast |

Default: **defer** with footer note when Phase 0–4 complete.

---

## Testing strategy

| Phase | Must pass |
| --- | --- |
| 0 | Baseline 152; characterization RED |
| 1 | glass-contrast, glass-performance (rewritten), a11y, border-consumption |
| 2 | card tests, ssr-safety, typecheck @pumni/ui |
| 3 | typecheck @pumni/web; design-system glass tests updated/deleted |
| 4 | ai:check |
| End | full @pumni/ui test + typecheck; scoped web tests |

Characterization first: never delete simple/titlebar without red→green tests.

---

## Definition of Done

- [ ] User confirmed A1–A9 (or recorded overrides)  
- [ ] Optical: one readable recipe; no production simple/grain; no full-face reflection  
- [ ] API: no Card glass*; no GlassSurface titlebar  
- [ ] Showcase matches Window production pattern  
- [ ] Decision tree live in design-system + skill  
- [ ] All glass-related unit tests green; ai:check green  
- [ ] Phase 5 deferred or shipped with consumer  
- [ ] This plan status set to Shipped; hardening plan superseded banner  

---

## Risks & mitigations

| Risk | Mitigation |
| --- | --- |
| Removing Card glass breaks external import | Monorepo-only; rg before delete; typecheck full |
| Removing reflection makes UI “flat” | Rely on mask bevel + shadow-glass + inset bezel; soft/strong personalization still varies frost |
| Removing simple breaks design-trends lab | Playground can use local CSS or GlassSurface only; not production utility |
| Dialog content under overflow:hidden clips shadows/poppers | overflow on panel OK for dialogs that portalled; verify Select/Popover  
| Bevel z-index vs children | pointer-events none; isolation; test interactive dialogs |
| Scope creep media dim | Phase 5 fence |

---

## Rollback

| Phase | How |
| --- | --- |
| 1 | Restore glass.css / theme tokens |
| 2 | Restore card + glass-surface variants |
| 3 | Restore showcase files |
| 4 | Restore docs from git |

Prefer phase-sized reverts.

---

## Recommended default path (“confirm defaults”)

1. Phase 0 characterization  
2. Phase 1 optical (reflection off, simple gone, titlebar utility gone)  
3. Phase 2 API (Card glass* out, GlassSurface titlebar out)  
4. Phase 3 showcase + consumer compile  
5. Phase 4 docs/skill  
6. Defer Phase 5  

---

## Confirm checklist (user)

Reply **`confirm defaults`** to implement A1–A9 as written, or override e.g.:

- Keep `Card glass` as thin alias (not recommended)  
- Keep reduced face reflection instead of full remove  
- Keep `glass-panel-simple` playground-only file  

**Do not start Phase 1 code until confirm** (grill-requirements).
