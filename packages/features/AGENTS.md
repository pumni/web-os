# @pumni/features — package-scoped rules

Path-scoped contract for `packages/features`. Read when extracting reusable
feature logic from an app into a package.

## Summary

Placeholder barrel for cross-app feature modules. Today it exports no runtime
API; use it only when a feature has a real reuse boundary beyond
`apps/web/src/features`.

## Architecture

- `src/index.ts` is the public barrel.
- Extract pure, cross-app feature logic here only after it outgrows one app.
- Keep app route composition, React Server Components, and Next.js delivery code
  in `apps/web`.

## Stack

TypeScript only at present. Add dependencies conservatively and document the
boundary before moving feature code here.

## Commands

- `bun --filter @pumni/features typecheck`
- `bun run typecheck` when exporting a new public API

## Pitfalls

- Do not turn this into a dumping ground for app-specific helpers.
- Do not import `@/`, route handlers, Server Actions, Supabase privileged
  clients, or UI-only state stores.
- Server state still belongs in Server Components or TanStack Query consumers;
  do not mirror it into package globals.
