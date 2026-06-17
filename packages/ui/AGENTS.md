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
