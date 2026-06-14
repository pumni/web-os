# Surface System Unification — Implementation Plan

> **Audience:** an AI coding agent executing this in the Pumni Web OS repo.
> **Read first:** `AGENTS.md`, `apps/web/AGENTS.md` (Next.js 16 is NOT your
> training data), and `docs/conventions/design-system.md`. Obey the P0 security
> and token-first mandates. This plan is P5/P6 — it cannot override P0–P4.
> **Do not** invent new color primitives, bypass the a11y fallbacks in
> `glass.css`, or weaken the `glass-contrast` test.

## 0. Goal & chosen direction (locked)

The color/token layer is already consistent. The defect is **surface drift**:
features hand-roll surfaces with arbitrary opacity/blur/border values instead of
the existing primitives (`Card`, `GlassSurface`, glass utilities). Inventory of
the drift (evidence): ~5 distinct `bg-card/NN`, ~4 `bg-background/NN`, ~6
`bg-muted/NN`, **8** distinct `border-border/NN`, plus raw `backdrop-blur-*` and
raw `shadow-lg/2xl` that bypass the design system.

**Chosen aesthetic — "Glass floating, solid content" (Linear/Vercel-leaning):**

- **Glass is reserved for genuinely floating layers only:** Dialog, Sheet,
  Popover, DropdownMenu, ContextMenu, Command palette, Toast, Topbar, Dock,
  Sidebar rail, OS `Window`/titlebar, and small floating pills/overlays that
  literally hover over other content (e.g. the reaction bar over the video).
- **All content cards/panels/wells become solid & crisp:** opaque fill, one
  hairline border, subtle shadow, **no blur**.
- Keep the glass look where it floats — it stays beautiful but appears
  intentionally less often.

**Scope of THIS pass:** (1) build the foundation in `packages/ui` + tokens + doc
+ ESLint gate, then (2) migrate **only the `watch` feature** as the reference
implementation. All other features are out of scope here (Section 7).

## 1. Target surface vocabulary (the closed set)

After this work, **every** surface must be one of these. There is no other way to
make a surface.

| Role | How to build it | Use for |
| --- | --- | --- |
| **Floating glass** | `GlassSurface variant="panel\|bar\|window\|titlebar"` (or the `glass-*` utility on a Radix overlay) | Only the floating layers listed above. Carries the a11y fallbacks. |
| **Solid card** (raised content) | `<Card>` (new default `variant="solid"`) → `border bg-card shadow-sm rounded-xl` | Primary content surfaces: dashboard/settings cards, side panels, info cards. |
| **Inset well** (recessed nested) | `<Card variant="inset">` → `border border-border bg-muted rounded-xl` (no shadow); for non-Card `<div>` wells use `bg-muted border border-border` | Nested wells inside a card: stat tiles, list rows, scroll wells. Replaces every `bg-card/40 border-border/20`, `bg-muted/20 border`, `bg-background/25`. |
| **Control fill** | `bg-muted` (rest) + `motion-safe:hover:bg-muted/80` (hover only) | Small inline controls: `TabsList`, chips, code pills. Hover may keep ONE opacity step (`/80`); rest state is opaque. |
| **Status tint** | `bg-{destructive\|warning\|success\|primary}/10 border-{…}/20 text-{…}` | Inline status chips/banners. Standardized to **/10 fill + /20 border**, nothing else. |

**Hard rules:**

1. **No raw `backdrop-blur-*`** in `apps/web` or `@pumni/ui` component TSX. Blur
   only ever comes from the `glass-*` utilities (which live in `glass.css` and
   carry the reduced-transparency / forced-colors / `@supports` fallbacks).
2. **No surface-token opacity:** ban `bg-card/NN`, `bg-background/NN`,
   `bg-popover/NN`. Surfaces are opaque. (Hover-only `bg-muted/80` is the single
   tolerated exception, see Control fill.)
3. **One border:** `border-border`. Delete every `border-border/NN`. The only
   tinted borders allowed are **status** (`border-destructive/20`, etc.).
4. **No raw elevation shadows** (`shadow-lg`, `shadow-xl`, `shadow-2xl`). Content
   uses `shadow-sm`; floating depth comes from the `glass-*` utilities
   (`--shadow-glass*`).
5. **Radius via named utilities only** (`rounded-md/lg/xl`, `rounded-full` for
   pills). No `rounded-[Npx]`.
6. **No new color tokens.** Reuse `card`, `muted`, `border`, status tokens. This
   is a discipline + closed-variant fix, not a new palette.

## 2. Foundation changes (`packages/ui`, tokens, doc, gate)

### 2.1 `Card` — flip default to solid, add `inset` variant

File: `packages/ui/src/components/card.tsx`. Current `cardVariants` has
`variant: glass | solid` defaulting to **glass**. Change to:

```tsx
const cardVariants = cva("flex flex-col gap-6 rounded-xl py-6 text-card-foreground", {
  variants: {
    variant: {
      // Raised, crisp content surface — the new default.
      solid: "border bg-card shadow-sm",
      // Recessed nested well (no shadow, lower contrast fill).
      inset: "border border-border bg-muted",
      // Opt-in: floating translucent glass. Use ONLY when the card literally
      // floats over other content. Most content should NOT use this.
      glass: "glass-panel",
    },
    interactive: {
      true: "cursor-pointer transition-[transform,box-shadow] duration-[var(--duration-base)] ease-snappy motion-safe:hover:-translate-y-0.5 motion-safe:active:scale-(--press-scale)",
      false: "",
    },
  },
  defaultVariants: {
    variant: "solid",      // ← was "glass"
    interactive: false,
  },
});
```

- Keep `data-slot="card"` and `data-variant={variant ?? "solid"}` (update the
  fallback string from `"glass"` to `"solid"`).
- The sub-components (`CardHeader/Title/Description/Action/Content/Footer`) are
  unchanged.
- **Audit every existing `<Card>` consumer** (they currently rely on the glass
  default). After the flip they render solid — which is the desired content look.
  Files to re-check visually: `app/(app)/dashboard/page.tsx`,
  `app/(app)/settings/account/page.tsx`, `app/(app)/settings/appearance/page.tsx`,
  `features/profile/profile-form.tsx`, `features/watch/components/watch-lobby.tsx`,
  `features/sky-player/sky-player-intro.tsx`, `app/(app)/design-system/showcase.tsx`.
  If any of these genuinely needs to float (none identified), set
  `variant="glass"` explicitly. Do NOT mass-add `variant="solid"` — it is the
  default now.

### 2.2 `GlassSurface` — enforce the `variant` prop, fix double-application

Several call sites pass `className="glass-panel"` / `className="glass-bar"`
instead of using the `variant` prop. `GlassSurface` already defaults
`variant="panel"`, so:
- `<GlassSurface className="glass-panel …">` double-applies `glass-panel` (benign
  but wrong).
- `<GlassSurface className="glass-bar …">` applies **both** `glass-panel` (from
  the default variant) **and** `glass-bar` — a real bug.

**Rule:** glass role must be set via `variant`, never via `className`. The
migration (Section 4) fixes the watch call sites. No change to
`glass-surface.tsx` itself is required, but add a doc note (2.4).

### 2.3 No token changes required

`theme.css`/`tokens.css` already define `card`, `muted`, `border` for both
themes. Do **not** add `--surface-*` tokens in this pass — `bg-muted` is the
inset fill and `bg-card` is the raised fill. (If wells later need to diverge from
`muted`, introduce a single `--surface-inset` semantic token then — out of scope
now.)

### 2.4 Documentation — `docs/conventions/design-system.md`

Update to match reality:
- In "Surface Utilities and Overlay Roles" and the `card`/`popover` token row:
  change "Card defaults to translucent glass" → **"Card defaults to a solid raised
  surface; `variant="glass"` is opt-in for genuinely floating cards;
  `variant="inset"` is the recessed nested well."**
- Add a short **"Surface vocabulary (closed set)"** subsection reproducing the
  table in Section 1 of this plan, and the 6 hard rules.
- In the anti-slop table, add rows: `backdrop-blur-md` → "glass utility /
  `GlassSurface`"; `bg-card/40`, `border-border/20` → "solid surface tokens
  (opaque, `border-border`)".

### 2.5 ESLint gate — `pumniNoAdHocSurface`

Model it on the existing `pumniNoRawColor` in `packages/config/eslint.mjs`
(`no-restricted-syntax` with esquery `Literal` / `TemplateElement` selectors).
Add next to `restrictedRawColor`:

```js
const AD_HOC_SURFACE_PATTERNS = [
  // Raw blur — blur must come from the glass-* utilities (a11y fallbacks live there).
  "\\bbackdrop-blur(?:-(?:none|sm|md|lg|xl|2xl|3xl)|-\\[[^\\]]+\\])?\\b",
  // Opacity on surface tokens — surfaces are opaque in the unified system.
  "\\bbg-(?:card|background|popover)/\\d",
  // Raw elevation shadows — content uses shadow-sm; floating depth is the glass utility.
  "\\bshadow-(?:lg|xl|2xl)\\b",
];

const AD_HOC_SURFACE_MESSAGE =
  "Surface system is closed: no raw backdrop-blur (use GlassSurface/glass-* for floating layers), no bg-{card,background,popover}/NN opacity (surfaces are opaque — use Card solid/inset or bg-muted), no raw shadow-lg/xl/2xl (content=shadow-sm, floating=glass utility). See docs/conventions/design-system.md §Surface vocabulary.";

export const restrictedAdHocSurface = [
  "error",
  ...AD_HOC_SURFACE_PATTERNS.flatMap((pattern) => [
    { selector: `Literal[value=/${pattern}/]`, message: AD_HOC_SURFACE_MESSAGE },
    { selector: `TemplateElement[value.raw=/${pattern}/]`, message: AD_HOC_SURFACE_MESSAGE },
  ]),
];

export const pumniNoAdHocSurface = [
  {
    name: "pumni/no-ad-hoc-surface",
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/test/**", "**/*.test.{ts,tsx}"],
    rules: { "no-restricted-syntax": restrictedAdHocSurface },
  },
];
```

- Wire `pumniNoAdHocSurface` into **both** `apps/web/eslint.config.mjs` and
  `packages/ui`'s eslint flat config, exactly where `pumniNoRawColor` is spread
  in today (grep for `pumniNoRawColor` usage and mirror it).
- **Important:** `no-restricted-syntax` does not merge across config objects with
  the same key — if a file already sets `no-restricted-syntax` via
  `pumniNoRawColor`, confirm both fragments apply (they are separate flat-config
  objects, so both run; verify with a deliberate violation during testing).
- **Turn the rule on only after the watch migration compiles clean**, otherwise
  `lint` fails mid-migration. Sequence: migrate watch (Section 4) → add rule →
  `bun run lint` → fix stragglers. The showcase
  (`app/(app)/design-system/showcase.tsx`) and other not-yet-migrated features
  WILL trip the rule; either migrate their offending lines too or, if you must
  defer, scope the rule's `files`/`ignores` to exclude them **with a TODO** — do
  not leave `lint` red.

## 3. Deterministic mapping table (find → replace)

Apply mechanically, but **classify the surface first** (floating vs content vs
well vs control vs status) — the right replacement depends on role.

| Found (ad-hoc) | Role | Replace with |
| --- | --- | --- |
| `bg-card/30..80` on a hand-rolled `<div>` surface | content/well | `<Card variant="inset">` or `bg-muted border border-border` |
| `<Card className="bg-card/45 border-border/85">` | content card | `<Card>` (solid default), drop the className overrides |
| `bg-background/NN` + `backdrop-blur-*` on chrome (topbar/bar) | floating | `GlassSurface variant="bar"` (or `glass-bar` on the element) |
| `bg-background/NN` on a nested well/row | well | `bg-muted` (+ `border-border`) |
| `bg-muted/10..50` as a panel/well fill | well | `bg-muted` |
| `bg-muted/50..60` as a `TabsList`/control fill | control | `bg-muted` |
| `bg-muted/60` hover | control hover | `motion-safe:hover:bg-muted/80` (keep ONE step) |
| `border-border/10..85` | any | `border-border` |
| `backdrop-blur-*` on a floating pill/banner | floating | `GlassSurface variant="panel" radius="full"` (pill) |
| `backdrop-blur-*` on content | content | **remove** (content is solid) |
| `shadow-lg` / `shadow-2xl` on content | content | `shadow-sm` |
| `bg-{destructive,warning,success}/8..N` + `border-{…}/N` | status | `bg-{…}/10 border-{…}/20 text-{…}` |
| `rounded-[Npx]` | any | nearest named `rounded-*` |

## 4. Watch feature migration (file-by-file)

Reference implementation. Classify each surface, then apply Section 3. Exact
sites (verify line numbers, they drift):

### `features/watch/components/watch-room.tsx`
- **Header bar** (~L274): currently `<GlassSurface className="glass-bar … border border-glass-border">`. **Floating chrome → keep glass.** Change to
  `<GlassSurface variant="bar" className="… rounded-xl">` and drop the redundant
  `glass-bar` + `border border-glass-border` (glass-bar sets its own border).
- **Room-code pill** (~L309): `border border-border/30 bg-muted/30 hover:bg-muted/60`
  → control: `border-border bg-muted motion-safe:hover:bg-muted/80`.
- **"Mất kết nối" chip** (~L294): `bg-destructive/10 border border-destructive/20`
  → already the standard status tint; leave as-is (it is the canonical pattern).
- **Mobile `SheetContent`** (~L384): `bg-card border-l border-border/20`. The Sheet
  is a floating drawer — its base should be the component's glass-panel default;
  drop the `bg-card` override and change `border-border/20` → `border-border` (or
  remove the side-border override entirely if the panel already has one).
- **`TabsList`** (~L425): `bg-muted/50` → `bg-muted`.

### `features/watch/components/side-dock.tsx`
- **Root `SideDock`** (~L58): currently `<GlassSurface className="glass-panel …">`.
  This is a **content side panel** (a layout column + the body of the mobile
  Sheet), not floating chrome. **Convert to solid:** replace with
  `<Card variant="solid" className="h-full flex flex-col rounded-xl overflow-hidden select-none p-0">`
  (Card default solid; note Card has `py-6` — override padding to `p-0` since this
  panel manages its own inner padding). Remove the `GlassSurface` import if now
  unused. *(Judgment call: if the user prefers the dock to read as floating
  chrome, keep `GlassSurface variant="panel"` instead. Default decision = solid,
  per the chosen direction. Flag this one in your PR description.)*
- **`TabsList`** (~L61): `bg-background/30 border border-border/20` → `bg-muted border-border`.
- **Participant count badge** (~L72): `bg-muted/60` → `bg-muted`.
- **Participant row** (~L124): `rounded-lg border border-border/10 bg-background/25`
  → inset well: `rounded-lg border border-border bg-muted`.
- **Avatar ring** (~L127): `border border-border/25` → `border-border`.
- **Transfer-host button border** (~L155): `border border-primary/15` → status/accent
  tint; standardize to `border-primary/20` (keeps the brand-tinted affordance but on
  the canonical step).

### `features/watch/components/playlist-panel.tsx`
- Header (~L235): `rounded-xl border border-border/20 bg-card/50` → `<Card variant="inset">` or `rounded-xl border border-border bg-muted`.
- `TabsList` (~L243): `bg-muted/50 border border-border/20` → `bg-muted border-border`.
- List item (~L358): `border-border/15 bg-card/40 hover:bg-card/80 hover:border-border/30`
  → inset row with one hover step: `border-border bg-muted motion-safe:hover:bg-muted/80`.
- Badge (~L397): `bg-muted/60` → `bg-muted`.

### `features/watch/components/chat-panel.tsx`
- Avatar ring (~L81): `border border-border/30` → `border-border`.
- Divider borders (~L118, ~L135): `border-t border-border/15` → `border-t border-border`.

### `features/watch/components/reaction-bar.tsx`
- Pill (~L14): `rounded-full border border-border/10 bg-background/25 backdrop-blur-md shadow-lg`.
  This pill **floats over the video → glass is allowed.** Replace with
  `<GlassSurface variant="panel" radius="full" className="flex items-center gap-1.5 px-3 py-1.5 select-none w-fit">`
  (glass-panel carries `--shadow-glass`, so drop `shadow-lg`).
- Button hover (~L21): `hover:bg-background/40` → `motion-safe:hover:bg-muted/80`
  (or `hover:bg-accent` for a brand-tinted hover).

### `features/watch/components/sync-player.tsx`
- Video frame (~L69): `rounded-xl border border-border/20 shadow-2xl` →
  `rounded-xl border border-border shadow-sm`. (Stage emphasis comes from size,
  not a raw mega-shadow. If more lift is wanted, that is a token discussion — do
  not reintroduce `shadow-2xl`.)

### `features/watch/components/host-claim-banner.tsx`
- Banner (~L15): `rounded-xl border border-warning/30 bg-warning/8 backdrop-blur-sm`
  → solid status surface (no blur): `rounded-xl border border-warning/20 bg-warning/10 text-warning`.

### `features/watch/components/participant-rail.tsx`
- (~L43): `border-border/40` → `border-border`.

### `features/watch/components/watch-lobby.tsx`
- `TabsList` (~L133): `bg-muted/50` → `bg-muted`. Also re-check its `<Card>` usages
  now render solid (desired).

### `features/watch/components/room-controls.tsx`, `sync-indicator.tsx`, `tap-to-play-overlay.tsx`
- `room-controls` / `sync-indicator` glass usages overlay the video player →
  **floating → keep glass**, but switch any `className="glass-*"` to the
  `variant` prop and clean any `/NN` borders.
- `tap-to-play-overlay` (~L12): `bg-overlay/80 backdrop-blur-sm` is a **modal-style
  scrim** over the player. `bg-overlay` is already the owned scrim token; the
  `backdrop-blur-sm` here is a deliberate scrim blur. **Decision:** to satisfy the
  no-raw-blur rule and keep a11y consistent, drop `backdrop-blur-sm` and rely on
  the `bg-overlay/80` scrim alone (overlay is already semi-opaque). If the blurred
  scrim is considered essential, add a dedicated `glass-scrim` utility in
  `glass.css` (with the same fallbacks) and use that — do not leave a raw
  `backdrop-blur` in TSX.

## 5. Validation

Run from repo root after each logical chunk:

```sh
bun run lint        # must be GREEN before enabling the new gate broadly
bun run typecheck
bun run test        # includes design-system unit tests (card.test.tsx, glass-contrast, motion-tokens)
bun run ai:check
```

- `card.test.tsx` asserts Card structure/variants — **update it** for the new
  default (`solid`) and the `inset` variant; keep a `glass` opt-in assertion.
- `glass-contrast.test.ts` resolves the cascade for glass surfaces — still valid
  (glass roles unchanged). Confirm it still passes; it should.
- **Visual regression** (`apps/web/e2e/design-system-visual.spec.ts`) WILL change
  (Card default flip + showcase surfaces). Regenerate baselines **in the Linux CI
  runner only** with `--update-snapshots` — never commit Windows baselines. Review
  the diff to confirm the new look is intended, not a regression.
- Manually smoke-test the watch room in light + dark + a non-indigo accent +
  reduced-transparency OS setting (glass layers must fall back to opaque).

## 6. Guard rails — do NOT break

1. **Keep the 5 a11y fallback layers** in `glass.css` intact (reduced-transparency,
   `@supports not backdrop-filter`, `prefers-contrast`, `forced-colors`,
   reduced-motion). Routing all blur through glass utilities is what preserves
   them — that is the whole point of banning raw `backdrop-blur`.
2. **Do not weaken `glass-contrast.test.ts`** to make something pass. If a solid
   surface fails contrast, fix the surface, not the test.
3. **No new color primitives / no raw `oklch()` in components** — `pumniNoRawColor`
   still applies. The unified surfaces use existing semantic tokens only.
4. **`@pumni/ui` stays pure** — no app/server/auth imports (`pumniUiBoundary`).
5. **Status tints are not surfaces** — `bg-destructive/10` etc. are intentionally
   excluded from the opacity ban; do not "fix" them to opaque.
6. **Don't mass-rewrite outside `watch`** in this pass (Section 7). Keep the diff
   reviewable.

## 7. Out of scope (follow-up passes)

These trip the same drift and the new gate but are **not** part of this pass.
List them for the next migration ticket; if the gate flags them before they are
migrated, scope `ignores` with an explicit TODO rather than rushing them:

- `app/(app)/layout.tsx:70` — content topbar `bg-background/80 backdrop-blur-md`
  → `glass-bar` (floating chrome).
- `features/sky-player/*` — `sky-player-intro.tsx`, `preview-window.tsx`
  (multiple `bg-card/30..80`, `bg-muted/NN`, `border bg-card/40`).
- `features/profile/profile-form.tsx` — `bg-overlay/40 backdrop-blur-[2px]`,
  `bg-card/40` footer.
- `components/app-shell/*` — `os-command.tsx` (`bg-background/40`),
  `app-sidebar.tsx` (`bg-muted/60`, `border-border/60`).
- `app/(app)/design-system/showcase.tsx` — many demo surfaces; update so the
  showcase reflects the new vocabulary (it is the visual contract).

## Summary of deliverables

1. `card.tsx`: default → `solid`, add `inset`, keep `glass` opt-in.
2. Watch feature: every surface mapped to the closed vocabulary (Section 4).
3. `design-system.md`: documents the closed surface vocabulary + 6 rules.
4. `eslint.mjs` + app/ui configs: `pumniNoAdHocSurface` gate (enable last).
5. `card.test.tsx` updated; visual baselines regenerated in CI; all gates green.
