# @pumni/ui — package-scoped rules

Package delta; root AGENTS.md applies.

## Summary

Framework-neutral React UI primitives (Radix, cva, motion, tailwind-merge). No database, no auth, no server logic. Consumers import via subpath only.

## Architecture

- **No root barrel file.** Import via subpath: `@pumni/ui/form`, `@pumni/ui/overlay`, `@pumni/ui/layout`, `@pumni/ui/feedback`, `@pumni/ui/identity`, `@pumni/ui/os`, or `@pumni/ui/lib/<name>`.
- The `exports` map in `package.json` is auto-generated: run `bun --filter @pumni/ui generate-exports`.
- Design tokens live in `src/styles/tokens.css`, `theme.css`, and `personalization.css`. Do not hardcode raw colors outside token files.

## Commands

- `bun --filter @pumni/ui typecheck`
- `bun --filter @pumni/ui lint`
- `bun --filter @pumni/ui generate-exports`

## Pitfalls

- **Never import** `@/`, `server-only`, or any `@pumni/*` package inside `packages/ui/src/**` (`@pumni/ui` must stay pure client-safe).
- Do not add Server Actions, route handlers, or Supabase calls here.
- Consumers **must** use subpath imports — barrel imports (`@pumni/ui`) are unsupported.
