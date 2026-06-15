# Design System Docs and Showcase Alignment Plan

## Purpose

Bring the project-facing Design System documentation, user-facing copy, and
`/design-system` showcase into alignment with the current `@pumni/ui`
implementation.

This is **not** a visual redesign and **not** a design-system implementation
migration. The current `packages/ui` tokens, utilities, components, and public
exports remain the source of implementation truth. The work here is to remove
stale or misleading language, document the system as it exists, and turn the
Design System tab into a complete, maintainable catalog for this project.

## Non-Goals

- Do not rename `glass-*` CSS utilities, `--glass-*` tokens, `GlassSurface`,
  `GlassLevel`, `pumni-glass`, or any exported `@pumni/ui` API.
- Do not change `Card` default variants, overlay behavior, token values,
  shadows, blur, personalization behavior, or component styling.
- Do not introduce a new visual language.
- Do not remove existing visual regression coverage unless replacing it with an
  equivalent test that preserves the same runtime behavior.
- Do not treat outdated documentation wording as permission to refactor
  production UI implementation.

## Current-State Findings

### Canonical Project Rules

- `@pumni/ui` is the shared pure UI primitive package. It must not import app
  aliases, server-only modules, Supabase, auth, env, validators, feature
  packages, or test utilities.
- `apps/web` owns routes, layouts, page-level composition, providers, and the
  Design System showcase.
- `docs/conventions/design-system.md` is the canonical design-system document
  loaded by agents through `docs/ai/index.md`.
- The showcase is rendered in two places:
  - authenticated app route: `apps/web/src/app/(app)/design-system/page.tsx`
  - public visual-regression route:
    `apps/web/src/app/design-system-preview/page.tsx`

### `@pumni/ui` Implementation Surface

Source of truth:

- `packages/ui/src/index.ts`
- `packages/ui/src/components/*`
- `packages/ui/src/styles/tokens.css`
- `packages/ui/src/styles/theme.css`
- `packages/ui/src/styles/glass.css`
- `packages/ui/src/styles/personalization.css`
- `packages/ui/src/styles/desktop.css`
- `packages/ui/src/lib/motion.ts`

Current package exports include:

- Utilities: `cn`, motion bridge (`duration`, `easing`, `motionTokens`,
  `recipes`, `transition`), and motion re-exports (`AnimatePresence`, `motion`,
  `useReducedMotion`).
- Foundation primitives: `Button`, `Card`, `Input`, `Label`, `Separator`,
  `Skeleton`.
- Form/selection primitives: `Form`, `FormField`, `FormItem`, `FormControl`,
  `FormLabel`, `FormDescription`, `FormMessage`, `Checkbox`, `Switch`,
  `Select`, `Tabs`, `Slider`.
- Media/identity primitives: `Avatar`, `AvatarImage`, `AvatarFallback`,
  `AvatarBadge`, `AvatarGroup`, `AvatarGroupCount`.
- Overlay/navigation primitives: `Dialog`, `Sheet`, `Popover`, `Tooltip`,
  `DropdownMenu`, `ContextMenu`, `CommandPalette`, `ScrollArea`.
- OS-like primitives: `GlassSurface`, `Dock`, `DockItem`, `Window`.
- Personalization: `PersonalizationProvider`, `PersonalizationScript`,
  `usePersonalization`, `ACCENTS`, `GLASS_LEVELS`.
- Toast: `Toaster`.

Important nuance: the implementation still contains real `glass` terms in
tokens, classes, and API. This plan must not infer that those should be renamed
or removed. The immediate issue is that docs and app copy describe "Liquid
Glass" as the project's design-system identity, while the requested goal is to
standardize the docs/showcase around the current project design system without
overstating that old branding.

### Drift and Gaps Found

Outdated or misleading language:

- `docs/conventions/design-system.md` opens with "Liquid Glass" as the visual
  language and repeatedly frames glass as the design-system identity.
- `docs/ai/index.md` routes "Design system (tokens, Liquid Glass, @pumni/ui)".
- `apps/web/src/app/(app)/dashboard/welcome-window.tsx` tells users the desktop
  runs on the "Liquid Glass" design system.
- `apps/web/src/app/(public)/auth-shell.tsx` comment says the screen is a
  "Liquid Glass panel".
- `apps/web/src/app/(app)/settings/appearance/page.tsx` exposes "Glass
  intensity" copy. This is backed by current implementation, so treat it
  carefully: adjust wording only if product language should be less old-brand
  specific, but do not remove the setting or change behavior.
- `apps/web/src/app/globals.css`, `packages/ui` comments, and tests contain
  old glass-centric comments. These comments may be updated for clarity only;
  avoid behavior changes.

Showcase gaps:

- `Slider` is exported from `@pumni/ui` and used in product code, but is absent
  from `apps/web/src/app/(app)/design-system/showcase.tsx`.
- The current showcase covers many primitives but is organized as a visual smoke
  page rather than a complete catalog.
- Some exports are underrepresented or only partially shown:
  - `AvatarBadge`
  - `CardAction`, `CardFooter`
  - `DialogClose`, `SheetClose`
  - `SelectGroup`, `SelectLabel`, `SelectSeparator`
  - horizontal `ScrollBar`
  - `Toaster` as app-level infrastructure
  - `PersonalizationProvider`/`PersonalizationScript` contract
- Foundation tokens are not visible enough as a system:
  - typography scale
  - radius scale
  - elevation/shadow examples
  - z-index/layering roles
  - motion tokens and CSS-vs-JS distinction
- The current page has repeated demo roles:
  - command palette appears in both header and menu section
  - toast trigger appears in header and feedback section
  - glass/surface examples are spread across hero, accessibility preview,
    dialogs, sheets, windows, and copy

Test drift:

- `apps/web/src/test/design-system/showcase.test.tsx` asserts text
  "Liquid Glass" and "Glass Accessibility Preview".
- `apps/web/e2e/design-system-visual.spec.ts` names one scenario
  "dark + strong glass" and writes `pumni-glass`.
- `apps/web/src/test/design-system/glass-contrast.test.ts` is partly a real
  implementation test for current `--glass-*` tokens and partly a naming signal
  that reinforces old terminology.

## Desired End State

1. Canonical docs describe the design system as token-first and `@pumni/ui`
   backed, without presenting "Liquid Glass" as the current project identity.
2. Product-facing copy no longer tells users the system is "Liquid Glass" where
   that is no longer true.
3. Implementation-specific terms like `GlassSurface`, `--glass-*`, and
   `pumni-glass` may remain documented as current API details where necessary,
   but should not be framed as the overall brand or design-system direction.
4. `/design-system` becomes a best-practice internal catalog:
   - complete enough to prevent missing exported primitives like `Slider`
   - organized by foundations, inputs, surfaces, overlays, navigation,
     feedback, personalization, and motion
   - useful as a visual regression target
   - still deterministic and easy to test
5. Tests assert the new section structure and critical component coverage.

## Implementation Phases

### Phase 1 - Rewrite Canonical Design-System Docs

Scope:

- `docs/conventions/design-system.md`
- `docs/ai/index.md`

Tasks:

1. Rewrite the opening of `docs/conventions/design-system.md`.
   - Replace "Liquid Glass surfaces over a flat, calm shell" with a neutral
     current description such as:
     "Pumni Web OS uses a token-first surface system built from OKLCH
     primitives, semantic roles, motion tokens, and shared `@pumni/ui`
     primitives."
   - Keep the existing emphasis on semantic tokens, accessibility, motion, and
     package boundaries.
2. Reframe `glass.css` as current implementation detail for surface utilities,
   not the design-system identity.
   - Good wording: "surface utilities and transparency fallbacks".
   - Avoid declaring a new API name unless implementation has actually changed.
3. Preserve accurate sections:
   - token tiers
   - semantic token usage
   - radius scale
   - z-index scale
   - typography and motion tokens
   - personalization behavior
   - adding a component
   - `@pumni/ui` package boundary
4. Update inaccurate claims:
   - remove or soften "Card defaults to glass" as a design principle if the
     statement is being used as product identity. If mentioning current API
     behavior, explicitly call it "current implementation detail".
   - remove broad "Liquid Glass - use with intent" as a headline. Replace with
     a "Surface Utilities and Overlay Roles" section.
   - replace "strong glass" in visual-regression docs with "personalization
     variant" or "surface intensity variant", while noting that the current
     storage key is still `pumni-glass`.
5. Update `docs/ai/index.md`.
   - Change "Design system (tokens, Liquid Glass, @pumni/ui)" to something like
     "Design system (tokens, surfaces, motion, @pumni/ui)".

Acceptance:

- `rg -n "Liquid Glass" docs/conventions docs/ai` returns no active canonical
  guidance, or only a clearly marked legacy/API note.
- `docs/conventions/design-system.md` still documents every currently exported
  primitive family and keeps security/package-boundary rules intact.
- No implementation files are changed in this phase.

Validation:

- `bun run ai:check`

### Phase 2 - Fix Product and App Copy Drift

Scope:

- `apps/web/src/app/(app)/dashboard/welcome-window.tsx`
- `apps/web/src/app/(public)/auth-shell.tsx`
- `apps/web/src/app/(app)/settings/appearance/page.tsx`
- `apps/web/src/app/globals.css`
- comments in `packages/ui` files only if they describe outdated project
  identity rather than current API behavior

Tasks:

1. Dashboard welcome copy:
   - Replace "Liquid Glass design system" with current product language.
   - Suggested copy:
     "This desktop runs on Pumni's token-first design system: OKLCH color
     roles, shared `@pumni/ui` primitives, and accessible surfaces."
   - Keep the command palette/dock guidance.
2. Auth shell comment:
   - Replace "Liquid Glass panel" with "shared auth surface" or
     "token-driven auth surface".
   - Do not change `GlassSurface` usage.
3. Appearance settings:
   - Decide copy policy for "Glass intensity".
   - If product should avoid old terminology, change label to "Surface
     intensity" or "Transparency" while preserving `glass`, `setGlass`, and
     `GLASS_LEVELS` implementation.
   - If the setting name is considered implementation-facing and still
     acceptable, leave behavior and add no churn.
4. `globals.css` comment:
   - Replace "3-tier tokens + Liquid Glass" with "3-tier tokens + shared
     surface utilities".
5. Package comments:
   - Only update comments that would mislead future agents, such as saying the
     entire system is "modern Liquid Glass treatment".
   - Do not rename `glassSurfaceVariants`, `GlassSurface`, or `glass-panel`.

Acceptance:

- User-facing route copy no longer markets the current project as "Liquid
  Glass".
- Implementation APIs and behavior are unchanged.
- `rg -n "Liquid Glass" apps packages` returns only intentional legacy/API
  comments, or zero if comments were safely clarified.

Validation:

- `bun run lint`
- `bun run typecheck`

### Phase 3 - Rebuild the Design System Showcase as a Catalog

Scope:

- `apps/web/src/app/(app)/design-system/showcase.tsx`
- `apps/web/src/app/design-system-preview/page.tsx` only if wrapper copy or
  test id needs adjustment

Design principles:

- The first viewport should communicate the actual system: tokens, components,
  surfaces, motion, and personalization.
- The page is an internal tool/catalog, not a marketing page.
- Avoid nested cards inside cards.
- Keep sections scannable and dense.
- Use semantic tokens only.
- Keep demos deterministic for visual regression.
- Prefer complete primitive coverage over decorative storytelling.

Recommended structure:

1. Header
   - Title: "Design System"
   - Description: "Token foundations, shared primitives, surfaces, motion, and
     personalization from `@pumni/ui`."
   - Keep a small command/toast utility only if it helps QA; otherwise move
     those actions to their sections.

2. Foundations
   - Semantic palette:
     `background`, `foreground`, `card`, `popover`, `primary`, `secondary`,
     `muted`, `accent`, `success`, `warning`, `destructive`, `border`, `input`,
     `ring`, `overlay`.
   - Typography scale:
     rows for `text-xs`, `text-sm`, `text-base`, `text-lg`, `text-xl`,
     `text-2xl`, `text-3xl`, `text-4xl`.
   - Radius scale:
     swatches for `rounded-xs`, `rounded-sm`, `rounded-md`, `rounded-lg`,
     `rounded-xl`, `rounded-2xl`, `rounded-3xl`.
   - Elevation:
     examples for `shadow-sm`, component card surface, active window/elevated
     surface if already available through existing classes.
   - Layering:
     compact table of z-index role names from docs. This can be static text
     because it validates documentation visibility, not runtime stacking.

3. Actions and Inputs
   - Button variants:
     `default`, `secondary`, `outline`, `ghost`, `destructive`, `link`.
   - Button sizes:
     `xs`, `sm`, `default`, `lg`, `icon`, `icon-sm`.
   - Input + Label:
     normal, placeholder, invalid, disabled.
   - Form primitives:
     one `react-hook-form` example with description and message.
   - Checkbox:
     checked, unchecked, disabled if simple.
   - Switch:
     checked/unchecked.
   - Select:
     include `SelectGroup`, `SelectLabel`, `SelectSeparator`, and several
     `SelectItem`s.
   - Slider:
     add single-value slider with label and visible value.
     Optionally add a range slider if Radix/current component supports it cleanly.
   - Tabs:
     keep one compact settings example.

4. Surfaces and Layout
   - Card:
     show default card and `variant="solid"` card if current API supports it.
     Include `CardAction` and `CardFooter`.
   - Surface utility:
     keep `GlassSurface` demo because it is current API, but describe it as
     "surface utility" or "floating surface primitive" rather than a project
     identity.
   - Window:
     active/inactive example, close/minimize controls if deterministic.
   - Dock:
     keep one nav example.
   - ScrollArea:
     include vertical scroll and, if feasible, a horizontal example to cover
     `ScrollBar`.

5. Overlays and Menus
   - Dialog:
     show trigger and content. Include an explicit close action path.
   - Sheet:
     show side panel.
   - Popover:
     concise content.
   - Tooltip:
     hover/focus target.
   - DropdownMenu:
     include normal item, checkbox/radio item if possible, separator, shortcut,
     destructive item.
   - ContextMenu:
     right-click area.
   - CommandPalette:
     one trigger, one open dialog.

6. Feedback
   - Skeleton:
     text and block skeletons.
   - Toast:
     info, success, warning, error buttons.
   - Status chips:
     success/warning/destructive examples.
   - Separator:
     horizontal separator in context.

7. Identity and Personalization
   - Avatar:
     image fallback, sizes, `AvatarBadge`, `AvatarGroup`, `AvatarGroupCount`.
   - Accent:
     swatches for `ACCENTS`; do not require changing global state unless
     already safe/deterministic.
   - Surface intensity/glass level:
     document the current control if it remains in product; use neutral copy if
     the product should no longer say "Glass".
   - Mention `PersonalizationScript` in non-visible code comments only if
     necessary; avoid visible instructional text in-app.

8. Motion
   - CSS micro-feedback:
     interactive card/button.
   - JS recipes:
     `hoverLift`, `pressScale`, `staggerContainer` + `staggerItem`, `fadeRise`
     if easy to demonstrate.
   - `Window` enter/exit:
     keep mounted-by-default and toggle if current test pattern remains stable.

Implementation notes:

- Consider extracting small local helper components inside `showcase.tsx`:
  `Section`, `ExampleGrid`, `Swatch`, `SpecRow`, `TokenChip`.
- Keep helpers inside the showcase file unless they become reused elsewhere.
- Do not promote showcase-only helpers to `@pumni/ui`.
- Keep copy short and factual.
- Avoid visible text that explains keyboard shortcuts or "how to use" beyond
  what is natural for an internal catalog.
- Avoid adding new dependencies.

Acceptance:

- `Slider` is visible and queryable by accessible name.
- Every major exported primitive family from `@pumni/ui` has at least one
  showcase example or a deliberate note in the plan explaining why it is app
  infrastructure rather than visible catalog content.
- The page no longer has a hero/section labeled "Liquid Glass".
- No visible user-facing copy in the showcase frames the project identity as
  "Liquid Glass".
- Visual layout remains deterministic and non-overlapping at desktop and mobile
  widths.

Validation:

- `bun run test`
- `bun run typecheck`
- Browser or Playwright visual smoke of `/design-system-preview`
- `cd apps/web && bunx playwright test design-system-visual` when updating
  snapshots in the correct baseline environment

### Phase 4 - Update Showcase Unit Tests

Scope:

- `apps/web/src/test/design-system/showcase.test.tsx`

Tasks:

1. Replace assertions for "Liquid Glass" and "Glass Accessibility Preview" with
   new section headings.
2. Add coverage for:
   - `Slider` by role/name
   - Button variants section
   - Typography/foundation section
   - Avatar badge/group
   - Card footer/action if visible
   - Select grouped option if implemented
3. Keep existing interaction tests:
   - dialog opens
   - sheet opens
   - command palette opens
   - context menu opens
   - dropdown opens
   - preview/personalization toggles if still present
4. Avoid brittle text assertions for every token swatch. Assert section
   presence and a few critical examples.

Acceptance:

- Tests fail if `Slider` is accidentally removed from the showcase.
- Tests fail if old "Liquid Glass" heading is reintroduced as a primary
  showcase section.
- Tests remain deterministic in jsdom.

Validation:

- `bun run test`

### Phase 5 - Update Visual Regression Naming and Coverage

Scope:

- `apps/web/e2e/design-system-visual.spec.ts`
- visual snapshots, only in the correct CI-compatible environment

Tasks:

1. Update spec comments from "token / component / glass drift" to "token /
   component / surface drift".
2. Rename the test title "dark + strong glass" to "dark + strong surface
   intensity" or "dark + strong personalization".
3. Keep `localStorage.setItem("pumni-glass", "strong")` unless implementation
   changes in a separate future task. Add a small comment if needed:
   "Current storage key remains `pumni-glass`; this test name uses product
   language."
4. Rename screenshot only if the team is ready to update baselines:
   - from `showcase-glass-strong.png`
   - to `showcase-surface-strong.png` or similar
5. Do not update platform-specific snapshots from Windows for Linux CI unless
   that is the intended baseline environment.

Acceptance:

- E2E spec language no longer reinforces outdated project identity.
- Visual coverage still includes light, dark, accent variants, and the current
  surface-intensity/personalization variant.

Validation:

- `cd apps/web && bunx playwright test design-system-visual`

### Phase 6 - Audit Remaining Legacy Terminology

Scope:

- docs
- app copy
- package comments
- test names/comments

Tasks:

1. Run:
   - `rg -n "Liquid Glass" docs apps packages -S`
   - `rg -n "Glass intensity|strong glass|glass drift|Liquid" docs apps packages -S`
2. Classify each hit:
   - `allowed implementation API`: e.g. `GlassSurface`, `--glass-*`,
     `pumni-glass`, `GLASS_LEVELS`
   - `allowed legacy note`: explicitly marked as old terminology
   - `must update`: active docs, visible copy, test descriptions, comments that
     mislead agents
3. Update only `must update` hits.
4. Do not force zero `glass` hits, because implementation still uses current
   `glass` APIs.

Acceptance:

- No canonical doc or visible app copy claims the project design system is
  Liquid Glass.
- Remaining `glass` hits are current implementation names or explicitly
  intentional compatibility/API references.

Validation:

- `rg` commands above with reviewed output
- `bun run ai:check`
- `bun run lint`
- `bun run typecheck`
- `bun run test`

## Suggested Work Order

1. Phase 1 docs first, because this prevents future agents from repeating the
   stale assumption.
2. Phase 2 copy/comment drift next, because it is low-risk and clarifies product
   language.
3. Phase 3 showcase restructure in one focused PR or branch.
4. Phase 4 tests in the same PR as the showcase restructure.
5. Phase 5 visual spec naming after the showcase stabilizes.
6. Phase 6 audit last.

## File Checklist

Must inspect/edit:

- `docs/conventions/design-system.md`
- `docs/ai/index.md`
- `apps/web/src/app/(app)/design-system/showcase.tsx`
- `apps/web/src/test/design-system/showcase.test.tsx`
- `apps/web/e2e/design-system-visual.spec.ts`
- `apps/web/src/app/(app)/dashboard/welcome-window.tsx`
- `apps/web/src/app/(public)/auth-shell.tsx`
- `apps/web/src/app/(app)/settings/appearance/page.tsx`
- `apps/web/src/app/globals.css`

Inspect before touching:

- `packages/ui/src/index.ts`
- `packages/ui/src/components/card.tsx`
- `packages/ui/src/components/glass-surface.tsx`
- `packages/ui/src/components/personalization-provider.tsx`
- `packages/ui/src/styles/tokens.css`
- `packages/ui/src/styles/theme.css`
- `packages/ui/src/styles/glass.css`
- `packages/ui/src/styles/personalization.css`
- `packages/ui/src/styles/desktop.css`
- `packages/ui/src/lib/motion.ts`

Usually do not edit in this plan:

- component styling implementations in `packages/ui/src/components/*`
- token values in `packages/ui/src/styles/*`
- product feature UI outside visible copy drift

## Final Acceptance Criteria

- The plan remains documentation/showcase focused and does not require changing
  design-system implementation behavior.
- Canonical docs represent the current project as token-first and `@pumni/ui`
  based, not as a Liquid Glass redesign.
- Dashboard/auth/settings copy no longer overstates old design language.
- `/design-system` includes `Slider` and enough exported primitives to serve as
  a practical catalog.
- Unit tests protect the new showcase structure.
- Visual regression coverage still protects light, dark, accent, and current
  personalization/surface-intensity states.
- Remaining old terminology is either removed or explicitly justified as current
  API/implementation naming.
