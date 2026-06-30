# @pumni/ui — package-scoped rules

Path-scoped contract for `packages/ui`. Read when editing this package. The root
`AGENTS.md` and `docs/conventions/*` still apply; this file only adds the
package-specific boundary.

## Summary

Framework-neutral React UI primitives (Radix, cva, motion, tailwind-merge). No
database, no auth, no server logic. Consumers import via subpath only.

## Architecture

- **No barrel file.** Import via subpath: `@pumni/ui/form`, `@pumni/ui/overlay`,
  `@pumni/ui/layout`, `@pumni/ui/feedback`, `@pumni/ui/identity`, `@pumni/ui/os`,
  or `@pumni/ui/lib/<name>`. There is no `@pumni/ui` entry point.
- The `exports` map in `package.json` is auto-generated from the filesystem by
  `bun --filter @pumni/ui generate-exports` (or validated in CI with `--check`).
- Components are grouped by functional role under `src/components/`:
  - `form/` — inputs, controls, form scaffolding (button, input, select, form…)
  - `overlay/` — floating/portaled layers (dialog, popover, dropdown-menu…)
  - `layout/` — structural & presentational primitives (card, separator, tabs…)
  - `feedback/` — status indicators & transient UI (8 primitives — see
    `feedback` sub-roles table below).
  - `identity/` — Pumni brand tier (glass-surface, personalization-provider)
  - `os/` — desktop shell (window, dock, bento-grid)

### `feedback/` sub-roles

The folder deliberately mixes 8 primitives under one subpath because they all
answer the same consumer need: "short-lived / status-driven UI that doesn't
own a layout". None of them wrap a Radix primitive — visual + status concepts
are owned here. Only `sonner.tsx` reaches outside for behavior (the Sonner
toaster), and that is a stack-level integration, not a UI primitive.

| Sub-role                  | Primitives                                  | Why no Radix                       |
| ------------------------- | ------------------------------------------- | ---------------------------------- |
| **Tone indicators**       | `Badge`, `PingDot`                          | Visual chip / animated dot — no behavioral primitive to own. |
| **Transient status**      | `Skeleton`, `Spinner`, `Toaster`            | Pure visual placeholders + a stacked toast surface (`Toaster` wraps Sonner, owns the floating `glass-panel` + `--z-toast`). |
| **Surface chrome**        | `Banner`                                    | Inline notice primitive — never portaled, no focus-trap or roving-tabindex semantics. |
| **Domain UI vocabulary**  | `ChatBubble`, `KbdChip`                     | Pumni OS surface vocabulary drawn from chat + keyboard-help surfaces; no Radix equivalent. |

When you add a new `feedback/` primitive, decide which sub-role it serves and
keep it there. If a candidate actually ports a Radix behavior (e.g. radio
notification center), it belongs in `overlay/`.
- When adding a component:
  1. Place the file in the matching group folder.
  2. Export it from that group's `index.ts` barrel (e.g. `src/components/form/index.ts`).
  3. The `exports` map is auto-generated — run `bun --filter @pumni/ui generate-exports` or
     `bun --filter @pumni/ui generate-exports --check` in CI.
- Design tokens live in `src/styles/tokens.css`, `theme.css`, and
  `personalization.css`. Raw `oklch()` and primitive color vars (`--indigo-*`,
  `--violet-*`, etc.) elsewhere fail `checkDesignTokenBoundaries`.

## Stack

Radix UI, class-variance-authority, motion, next-themes, tailwind-merge,
react-hook-form, sonner. Peer deps: React 19 (React Compiler enabled). Workspace dep: `@pumni/config`.

## Commands

- `bun --filter @pumni/ui typecheck`
- `bun --filter @pumni/ui lint`
- `bun --filter @pumni/ui generate-exports --check` (validate exports map in CI)
- `bun --filter @pumni/ui generate-exports` (regenerate exports map)
- `bun run ai:check` (enforces the import + token boundaries)

## Pitfalls

- **Never import** `@/`, `server-only`, or any `@pumni/` server package
  (`auth`, `supabase`, `env`, `features`, `validators`, `config` is allowed).
  `checkUiPackageBoundaries` blocks these and they break the "pure UI" contract.
- Do not add Server Actions, route handlers, or Supabase calls here.
- Do not introduce a new raw color or token; add it to the token files first.
- Consumers **must** use subpath imports — barrel imports (`@pumni/ui`) are
  unsupported. The group barrel (`form/index.ts`, `overlay/index.ts`, etc.) is
  the single source of truth for each group's public API.
