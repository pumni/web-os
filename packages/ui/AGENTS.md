# @pumni/ui — package-scoped rules

Package delta; root AGENTS.md applies.

## Summary

Framework-neutral React UI primitives (Radix, cva, motion, tailwind-merge). No
database, auth, or server logic; consumers import via subpath only.

## Architecture

- The package has no root barrel. Consumers use the subpaths in `package.json`.
- The `exports` map is generated; run `bun --filter @pumni/ui generate-exports`
  after adding a public component entry point.
- Token ownership starts at `src/styles/tokens.css`, `theme.css`, and
  `personalization.css`; inspect those sources before adding styling values.

## Pitfalls

- `packages/ui/src/**` must stay independent of `@/`, `server-only`, and other
  `@pumni/*` packages. Do not add Server Actions, route handlers, or Supabase
  calls here.
