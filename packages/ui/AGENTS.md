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
  `bun run generate-exports` (or validated in CI with `--check`).
- Components are grouped by functional role under `src/components/`:
  - `form/` — inputs, controls, form scaffolding (button, input, select, form…)
  - `overlay/` — floating/portaled layers (dialog, popover, dropdown-menu…)
  - `layout/` — structural & presentational primitives (card, separator, tabs…)
  - `feedback/` — transient status (skeleton, sonner)
  - `identity/` — Pumni brand tier (glass-surface, personalization-provider)
  - `os/` — desktop shell (window, dock, bento-grid)
- When adding a component:
  1. Place the file in the matching group folder.
  2. Export it from that group's `index.ts` barrel (e.g. `src/components/form/index.ts`).
  3. The `exports` map is auto-generated — run `bun run generate-exports` or
     `bun run generate-exports --check` in CI.
- Design tokens live in `src/styles/tokens.css`, `theme.css`, and
  `personalization.css`. Raw `oklch()` and primitive color vars (`--indigo-*`,
  `--violet-*`, etc.) elsewhere fail `checkDesignTokenBoundaries`.

## Stack

Radix UI, class-variance-authority, motion, next-themes, tailwind-merge,
react-hook-form, sonner. Peer deps: React 19. Workspace dep: `@pumni/config`.

## Commands

- `bun --filter @pumni/ui typecheck`
- `bun --filter @pumni/ui lint`
- `bun run generate-exports --check` (validate exports map in CI)
- `bun run generate-exports` (regenerate exports map)
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
