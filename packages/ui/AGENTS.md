# @pumni/ui — package-scoped rules

Path-scoped contract for `packages/ui`. Read when editing this package. The root
`AGENTS.md` and `docs/conventions/*` still apply; this file only adds the
package-specific boundary.

## Summary

Framework-neutral React UI primitives (Radix, cva, motion, tailwind-merge). No
database, no auth, no server logic. Consumers import components and styles only.

## Architecture

- Exports raw TS/TSX from `./src/index.ts` and styles from `./src/styles/*`.
- `optimizePackageImports: ['@pumni/ui']` in `apps/web/next.config.ts` relies on
  the barrel being tree-shakeable — keep the index re-exporting components only.
- Components are grouped by functional role under `src/components/` so the
  directory reflects the ADR-0010 concern split (primitive / identity / shell):
  - `form/` — inputs, controls, form scaffolding (button, input, select, form…)
  - `overlay/` — floating/portaled layers (dialog, popover, dropdown-menu…)
  - `layout/` — structural & presentational primitives (card, separator, tabs…)
  - `feedback/` — transient status (skeleton, sonner)
  - `identity/` — Pumni brand tier (glass-surface, personalization-provider)
  - `os/` — desktop shell (window, dock, bento-grid)
  When adding a component, place it in the matching group, add the barrel export
  in `src/index.ts`, and add/point the `exports` entry in `package.json` (subpath
  keys do NOT encode the folder — `@pumni/ui/button` stays `./button`). A new
  component without an `exports` entry is unreachable via subpath import. The
  shadcn CLI (`npx shadcn add`) drops files at `src/components/` root — move the
  result into the right group before committing.
- Design tokens live in `packages/ui/src/styles/tokens.css`, `theme.css`, and
  `personalization.css` only. Raw `oklch()` and primitive color vars
  (`--indigo-*`, `--violet-*`, etc.) anywhere else fail
  `checkDesignTokenBoundaries` in `bun run ai:check`.

## Stack

Radix UI, class-variance-authority, motion, next-themes, tailwind-merge,
react-hook-form, sonner. Peer deps: React 19. Workspace dep: `@pumni/config`.

## Commands

- `bun --filter @pumni/ui typecheck`
- `bun --filter @pumni/ui lint`
- `bun run ai:check` (enforces the import + token boundaries below statically)

## Pitfalls

- **Never import** `@/`, `server-only`, or any `@pumni/` server package
  (`auth`, `supabase`, `env`, `features`, `validators`, `config` is allowed).
  `checkUiPackageBoundaries` blocks these and they break the "pure UI" contract.
- Do not add Server Actions, route handlers, or Supabase calls here.
- Do not introduce a new raw color or token; add it to the token files first.
