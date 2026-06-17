---
title: Dashboard UI Redesign & Optimization
status: proposed
owner: apps/web
last-updated: 2026-06-17
audit-source: manual comparison vs `apps/web/src/app/(app)/dashboard/` against `docs/conventions/design-system.md`, `@pumni/ui` exports, and the dashboard audit reply (this conversation)
---

# Dashboard UI Redesign & Optimization

## Summary

Re-tighten the Dashboard tab onto house primitives: rebalance the Bento tier
sums so the desktop grid wraps cleanly, replace ad-hoc size/typography classes
with `BentoGridItem` props and the existing type roles, add a Quick Actions
strip below the grid, and ship truthful loading/empty states for the tiles
that will eventually read from Supabase. Delete `welcome-window.tsx` (dead
code) and align the dashboard with `OsCommand` + `AppSidebar` so the topbar is
the only place that owns global navigation chrome.

The work is scoped to cosmetic UI + structure under
`apps/web/src/app/(app)/dashboard/`. No data layer, no Supabase migration.

## Goals & Non-Goals

### Goals

- Layout grid sums to exactly 12 cols at every breakpoint; the desktop
  arrangement is **two stacked rows** with no orphan tiles.
- Every tile reuses `@pumni/ui` primitives and respects
  `docs/conventions/design-system.md` (tokens, motion, surface vocabulary).
- All tiles ship explicit `loading` / `empty` states so the page does not
  advertise capabilities the data layer cannot yet provide.
- Hero card stays in the Bento as a "Hero deck"; its CTA copy points users
  to **first-class** navigation already exposed by the shell
  (`OsCommand`, `AppSidebar`).

### Non-Goals

- No new tile that requires live data (recent rooms, sync metrics,
  notifications) — those ship as `loading` placeholders **only**.
- No state changes, no new queries / Server Actions, no Supabase schema
  changes.
- No changes to `@pumni/ui`, `@pumni/auth`, `@pumni/supabase`, or any other
  package — this PR stays inside `apps/web/`.
- No i18n work; copy stays a single English string per tile. i18n is a
  follow-up.
- No redesign of `AppShell`, `AppSidebar`, `AppTopbar`, `OsCommand`, or
  `PreviewWindow`.

## Affected Files

| Path | Change |
|---|---|
| `apps/web/src/app/(app)/dashboard/page.tsx` | Restructure to two-row Bento; add Quick Actions strip; consume new constants/types |
| `apps/web/src/app/(app)/dashboard/quick-actions.tsx` *(new)* | Server Component, "Quick Actions" strip below the grid |
| `apps/web/src/app/(app)/dashboard/dashboard-clock-card.tsx` | Replace `min-h-30`/`text-[Npx]` with `BentoGridItem` `minHeight` + type roles |
| `apps/web/src/app/(app)/dashboard/dashboard-accent-card.tsx` | Same; add `loading="error"` skeleton fallback |
| `apps/web/src/app/(app)/dashboard/dashboard-profile-card.tsx` *(new)* | Extract profile tile to keep `page.tsx` readable |
| `apps/web/src/app/(app)/dashboard/dashboard-watch-card.tsx` *(new)* | Extract watch tile; mark as `loading` |
| `apps/web/src/app/(app)/dashboard/dashboard-meta.ts` *(new)* | Tile catalog: id, title, description, icon, href/target |
| `apps/web/src/app/(app)/dashboard/welcome-window.tsx` | **DELETE** (dead code, no importers) |
| `apps/web/src/app/(app)/dashboard/dashboard-dock.tsx` | No functional change, but verify active state still works after copy edits |

Nothing outside `apps/web/src/app/(app)/dashboard/` should be touched.

## Layout Target

### Desktop (≥1024 px, 12-col grid)

```
Row 1 (height = 2n cols-rows blended):
┌────────────────────────────┬──────────┬──────────┐
│  Hero (tier="hero")       │ Clock    │ Accent   │
│  span 6 × row-span-2      │ 3        │ 3        │
│                           ├──────────┴──────────┤
│                           │ Sky Player (feature)│
│                           │ span 6 × row-span-2 │
└────────────────────────────┴─────────────────────┘

Row 2 (height = hero):
┌────────────────────────────┐
│ Watch Together             │ Profile     │ Cmd-K hint
│ tier="full", 12 cols       │ 3           │ 3 metric
└────────────────────────────┘
```

Sums to 12 cols per row → no orphan. The "Sky Player" tile stretches 6×2
to balance the Hero.

If row 2 has only two tiles at full + metric + metric = 12+3+3 = 18 cols
(overflow), drop one of the metric tiles into row 1 column pairs. The
decision rule is encoded below.

### Tablet (≥640 px, 6-col grid)

Tiles collapse via the primitive's `sm:col-span-*` mapping — we do not
override. Confirmed in `packages/ui/src/components/bento-grid.tsx`.

### Mobile (<640 px, 1 col)

All tiles span full width in source order: Hero → Clock → Accent → Sky
Player → Watch Together → Profile. We will not reorder for mobile.

Tier math already documented at `bento-grid.tsx:73–87`, we keep it.

## Tile Catalog

Centralized in `dashboard-meta.ts` so copy + icons are a single source. Each
entry is `Readonly<{ id, tier, icon, title, description, cta? }>`.

| Tile | ID | Tier | Title | Notes |
|---|---|---|---|---|
| Hero | `hero` | `hero` | "Welcome to Pumni OS" | Hero deck, no `interactive`. CTA wires two `Button asChild` to `/design-system` and `https://github.com/pumni/Sky-Player`. |
| Clock | `clock` | `metric` | "System time" | Uses `useClock()`. Skeleton prop `loading` until first tick. `minHeight={156}` from primitive. |
| Accent | `accent` | `metric` | "Accent theme" | 4 swatches, `usePersonalization`. Empty state shows "Loading accent…" while `data-accent` script hydrates. |
| Sky Player | `sky-player` | `feature` | "Sky Player · preview" | Replaces the inline `BentoGridItem` shell; pulls the existing `PreviewWindow` from `@/features/sky-player/preview-window`. |
| Watch Together | `watch` | `full` | "Watch Together" | `state="loading"` until Supabase hooks ship; CTA points to `/watch` (route exists). |
| Profile | `profile` | `metric` | "Your profile" | Avatar + email + Manage CTA. `minHeight={120}` for layout stability. |

New "Quick Actions" strip below the grid:

| Button | Variant | Target |
|---|---|---|
| Open Design System | `outline` | `/design-system` |
| Manage Profile | `ghost` | `/settings/profile` |
| Account Settings | `ghost` | `/settings/account` |
| Appearance | `ghost` | `/settings/appearance` |
| View GitHub | `default` | external link to Sky Player repo |

Goals: surface every sidebar entry's destination from the dashboard so the
hub is honest, and the GitHub CTA stays as the single external escape hatch.

## Implementation Steps

> Order matters: each step is independently shippable.

### 1. Delete `welcome-window.tsx`

- Confirm via `grep -r "WelcomeWindow" apps/web` → 0 hits.
- Remove file.

### 2. Create `dashboard-meta.ts`

A frozen const of all tile metadata. Pure data, no React. Prevents icon-name
typos and lets `page.tsx` stay compact.

### 3. Extract tile components

Move each tile body from `page.tsx` into its own file:

- `dashboard-profile-card.tsx`
- `dashboard-watch-card.tsx`

Leave `dashboard-clock-card.tsx` and `dashboard-accent-card.tsx` in place;
we only adjust classes inside (next step).

### 4. Tighten `dashboard-clock-card.tsx`

- Remove `min-h-30` from the wrapper.
- Drop the `<div>` wrapper entirely: pass `minHeight={156}` to the parent
  `BentoGridItem` in `page.tsx`.
- Replace `text-[10px]`/`text-[9px]` with named type roles
  (`type-caption`) and the project's existing size utility.

### 5. Tighten `dashboard-accent-card.tsx`

- Same `min-h-30` cleanup; rely on parent's `minHeight`.
- Acknowledge that `text-[10px]` is an exception worth surviving one more
  pass until a `KbdChip`/`kbd` primitive lands in `@pumni/ui`. Note this in
  the PR description.

### 6. Re-tier `page.tsx`

- Drop the `Sparkles` decorative icon from Hero to fight with `text-[Npx]`
  families and keep the icon as the "value" point.
- Wrap Hero CTA in a small flex row that uses logical properties
  (`ps-*` / `me-*`) per the design-system RTL guidance — applies to any new
  directional class added in this PR.
- For Sky Player's `BentoGridItem`, keep the `p-0 border-0 bg-transparent
  shadow-none` opt-out so the embedded `Window` glass isn't stacked under
  another Card surface.
- Map `dashboard-watch-card.tsx` to `state="loading"` so the existing Card
  primitive can drive the skeleton + border tint. No new code.
- Ensure full-card layout: `hero` (6×2) + `clock` (3) + `accent` (3) on row
  1; `sky-player` (6×2) on rows 1–2 beneath Hero (already correct); row 2
  has `watch` (full, 12) alone, with a small inline flex trimming profile
  into row 1 if row 2 looks orphaned (decision documented in code comment).

### 7. Add `quick-actions.tsx`

Server Component. Renders a single horizontal `Card` (variant `inset`) below
the grid with five `Button asChild` entries from the catalog. Width capped
at `max-w-7xl`, internal layout uses `flex-wrap gap-2`.

### 8. Reuse `Kbd` markup until a primitive exists

The hero card's `<kbd>⌘K</kbd>` and `OsCommand` already share the same
visual. For now, lift the markup into a tiny local
`apps/web/src/components/kbd.tsx` re-exported as `<Kbd>` (one-line Chippy
`kbd` styled with semantic tokens). This is **not** a `@pumni/ui` promotion
yet — it's an app-local utility used by `dashboard-meta.ts` and
`OsCommand`. Track promotion as a follow-up.

### 9. `apps/web/src/app/(app)/dashboard/page.tsx` final shape

```text
h1 (`type-title` with `text-gradient-brand`)
p  ("Welcome back, {user.email}")
BentoGrid
  Hero, Clock, Accent, SkyPlayer, Watch, Profile
QuickActions
DashboardDock  ← unchanged
```

We do not change `DashboardDock` in this PR.

### 10. Typography + surface sweep

Run `rg "text-\[\d+px\]" apps/web/src/app/\(app\)/dashboard` and `rg
"rounded-\[" apps/web/src/app/\(app\)/dashboard` to find stragglers. Any
remaining raw size or radius tokens get rewritten to `type-caption` /
`rounded-md/lg/xl`/`rounded-full`. The existing `pumniNoRawColor` lint and
the new `pumniNoAdHocSurface` rule (already wired in
`apps/web/eslint.config.mjs:5,13`) cover colour and surface for us.

### 11. Loading/empty state contract

Every tile that will eventually fetch data passes one of:

- `BentoGridItem loading={isPending}` — uses Bento skeleton primitive.
- Card `state="error"` — destructive tint + a11y `aria-live` region.
- Card `state="loading"` — animated breathing pulse.

Currently this applies only to the Watch Together tile. The Hero, Clock,
Accent, Sky Player, and Profile tiles all render synchronously today, so
their "empty state" is the tile itself.

### 12. Accessibility pass

- Provide `aria-labelledby` from `<h1>` on the Bento grid container so SR
  reads "Dashboard, region" before the tile titles.
- Each `BentoGridItem` already uses `type-heading` → `<h3>` internally. Add
  an `aria-label` only on tiles without descriptive content (none expected
  after refactor).
- Ensure the Watch Together skeleton has `aria-busy="true"`; this comes
  from `Card state="loading"` automatically (see `card.tsx:111–112`).
- The Quick Actions strip is wrapped in a `<nav aria-label="Quick
  actions">`.

## Risks & Follow-up

| # | Risk | Mitigation / Follow-up |
|---|---|---|
| 1 | Tier sums still overflow at 12 cols if we add too many `metric` tiles. | Math checked in §"Layout Target" — we'll lock it once `page.tsx` is rewritten. |
| 2 | WelcomeWindow behavior was hiding something users miss in prod. | Search for any docs/landing that links to it before deleting. |
| 3 | `<Kbd>` is still local; a future app wants to share. | Promote to `@pumni/ui` once a second consumer appears. |
| 4 | Server clock drift inside `useClock` after long tabs. Documented as MVP; track promotion to shared `useNow(deltaMs)` later. |
| 5 | Hero CTA GitHub anchor can break if the repo moves. | External-route pattern — accept as external-link responsibility, document in PR. |
| 6 | Bento visual regression at new tier sums. | Add a manual Playwright snapshot under `apps/web/e2e/dashboard.spec.ts` mirroring `design-system-visual.spec.ts` workflow. |
| 7 | i18n strings still hard-coded. | Out of scope; tracked separately. |
| 8 | Personalization hydration flash on first paint. | Mitigated by `PersonalizationScript` in root layout, confirmed in audit reply. |

## Validation Plan

After the diff, run from the repo root:

- `bun run lint` — color/surface/Next rules
- `bun run typecheck` — TS for `@pumni/ui` + `apps/web`
- `bun run test` — added `dashboard-clock-card.test.tsx` if we change the
  clock component; skip otherwise
- `bun run build` — production bundle
- `bun run ai:check` — AI context still points at canonical files
- `bun run ai:eval` — regression evals

Per-task route: this is **r0-ui** (`docs/ai/task-routes/r0-ui.md`) — no
Supabase, no Auth, no Server Action cache. Stay inside that budget.

## Out of Scope (deferred)

- Recent rooms / activity feed
- Sync metrics / system status
- Notifications / toasts from dashboard actions
- i18n string extraction
- Server clock promotion to shared `useNow`
- Promotion of `<Kbd>` to `@pumni/ui`
- Visual regression baseline (Playwright snapshot) — track separately
